
import { COUNTRY_RULES } from '../constants';
import { CalculationResult, Deductible, DeductionResult, UserInputs, CountryCode, TaxBracket } from '../types';

const calculateTaxAmount = (
    grossIncome: number, 
    deductible: Deductible, 
    inputs: UserInputs, 
    accumulatedTax: number
): number => {
  let basis = grossIncome;
  const { country, details } = inputs;
  const isMarried = details.maritalStatus === 'married';

  // --- SURCHARGE LOGIC (Church Tax, Soli, etc) ---
  if (deductible.isTaxSurcharge) {
      // 1. Check boolean flag if it exists (e.g. Church Tax toggle)
      if (deductible.name.includes('Church') && !details.churchTax) {
          return 0;
      }
      
      // 2. Check threshold (e.g. Soli Freigrenze)
      if (deductible.surchargeThreshold && accumulatedTax < deductible.surchargeThreshold) {
          return 0;
      }

      return accumulatedTax * (deductible.rate || 0);
  }

  // --- STANDARD LOGIC ---

  // 1. Apply Age-Based Rate adjustments
  let effectiveRate = deductible.rate;
  if (deductible.ratesByAge && details.age) {
      const ageRule = deductible.ratesByAge.find(r => details.age > r.minAge && details.age <= r.maxAge);
      if (ageRule) {
          effectiveRate = ageRule.rate;
      }
  }

  // 2. Apply Income Cap (Wage Base)
  // Note: If cappedBase is present, tax is calculated on min(income, cap)
  if (deductible.cappedBase && basis > deductible.cappedBase) {
    basis = deductible.cappedBase;
  }

  // 3. Apply Standard Deduction / Exempt Amount
  let exempt = deductible.exemptAmount || 0;
  
  // Use Married exemption if available and applicable
  if (isMarried && deductible.exemptAmountMarried) {
      exempt = deductible.exemptAmountMarried;
  }

  basis = Math.max(0, basis - exempt);

  let computedAmount = 0;

  if (deductible.type === 'percentage' && effectiveRate) {
    computedAmount = basis * effectiveRate;
  } else if (deductible.type === 'progressive' && (deductible.brackets || deductible.bracketsMarried)) {
    
    // --- SPECIAL LOGIC: Germany Income Splitting ---
    // Germany doesn't use separate brackets, it uses the "Splitting Procedure".
    // Tax = 2 * TaxFunction(Income / 2)
    let processingIncome = basis;
    let multiplier = 1;

    if (country === CountryCode.DEU && isMarried && deductible.name.includes('Income Tax')) {
       processingIncome = basis / 2;
       multiplier = 2;
    }

    // Select Brackets (Married vs Single)
    let bracketsToUse = deductible.brackets || [];
    if (isMarried && deductible.bracketsMarried) {
        bracketsToUse = deductible.bracketsMarried;
    }

    // Standard Progressive Calculation
    const sortedBrackets = [...bracketsToUse].sort((a, b) => a.threshold - b.threshold);
    
    for (let i = 0; i < sortedBrackets.length; i++) {
      const bracket = sortedBrackets[i];
      const nextBracket = sortedBrackets[i + 1];
      const bottom = bracket.threshold;
      const top = nextBracket ? nextBracket.threshold : Infinity;
      
      if (processingIncome > bottom) {
          const incomeInBracket = Math.min(processingIncome, top) - bottom;
          computedAmount += incomeInBracket * bracket.rate;
      }
    }

    // Apply Germany Splitting Multiplier
    computedAmount *= multiplier;
  }

  // 4. Apply Tax Credits
  let credits = deductible.fixedCredits || 0;
  if (isMarried && deductible.fixedCreditsMarried) {
      credits = deductible.fixedCreditsMarried;
  }

  if (credits > 0) {
    computedAmount = Math.max(0, computedAmount - credits);
  }

  // 5. Apply Final Hard Cap (rare, mainly for fixed fees)
  if (deductible.cap && computedAmount > deductible.cap) {
    computedAmount = deductible.cap;
  }

  return computedAmount;
};

export const calculateNetPay = (inputs: UserInputs): CalculationResult => {
  const rules = COUNTRY_RULES[inputs.country];
  let grossAnnual = inputs.frequency === 'monthly' ? inputs.grossIncome * 12 : inputs.grossIncome;
  
  // Incorporate annual bonus if present
  if (inputs.annualBonus) {
    grossAnnual += inputs.annualBonus;
  }

  if (grossAnnual < 0) grossAnnual = 0;

  const deductionsBreakdown: DeductionResult[] = [];
  
  // Track Total Income Tax for Surcharges (Soli, Church Tax)
  let totalIncomeTax = 0;

  // 1. Federal Deductions
  rules.federalDeductibles.forEach(d => {
    const amount = calculateTaxAmount(grossAnnual, d, inputs, totalIncomeTax);
    
    // Accumulate Income Tax base for dependent taxes
    if (!d.isTaxSurcharge && (d.name.includes('Income Tax') || d.name.includes('Federal Income') || d.name.includes('PAYE'))) {
        totalIncomeTax += amount;
    }

    if (amount > 0 || d.employerPaid) { 
      if (amount > 0) {
        deductionsBreakdown.push({
            name: d.name,
            description: d.description,
            amount: amount,
            isEmployer: !!d.employerPaid
        });
      }
    }
  });

  // 2. Sub-national Deductions
  if (inputs.subRegion && rules.subNationalRules) {
    const regionRule = rules.subNationalRules.find(r => r.id === inputs.subRegion);
    if (regionRule) {
      regionRule.deductibles.forEach(d => {
        // State taxes often use Federal AGI, but here we assume Gross basis for simplicity unless complex linkage needed
        // In CA/NY, state tax is independent calc on Gross-like figure.
        const amount = calculateTaxAmount(grossAnnual, d, inputs, totalIncomeTax);
        if (amount > 0) {
          deductionsBreakdown.push({
            name: `${regionRule.name} - ${d.name}`,
            description: d.description,
            amount: amount,
            isEmployer: !!d.employerPaid
          });
        }
      });
    }
  }

  const totalEmployeeDeductionsAnnual = deductionsBreakdown
    .filter(d => !d.isEmployer)
    .reduce((sum, d) => sum + d.amount, 0);

  const netAnnual = grossAnnual - totalEmployeeDeductionsAnnual;
  const netMonthly = netAnnual / 12;
  
  const personalCostsMonthly = 
    (inputs.costs.rent || 0) + 
    (inputs.costs.groceries || 0) + 
    (inputs.costs.utilities || 0) + 
    (inputs.costs.transport || 0) +
    (inputs.costs.insurance || 0) + 
    (inputs.costs.emergencyFund || 0) + 
    (inputs.costs.debt || 0) + 
    (inputs.costs.freedomFund || 0);

  return {
    grossMonthly: grossAnnual / 12,
    grossAnnual,
    netMonthly,
    netAnnual,
    totalDeductionsMonthly: totalEmployeeDeductionsAnnual / 12,
    deductionsBreakdown,
    disposableMonthly: netMonthly - personalCostsMonthly,
    personalCostsTotal: personalCostsMonthly
  };
};

export const calculateGrossFromNet = (targetNet: number, baseInputs: UserInputs): number => {
  if (targetNet <= 0) return 0;
  const isMonthly = baseInputs.frequency === 'monthly';
  const targetAnnualNet = isMonthly ? targetNet * 12 : targetNet;

  let low = targetAnnualNet;
  let high = targetAnnualNet * 3;
  
  // Heuristic safety expansion
  let safety = 0;
  while (safety < 20) {
      const res = calculateNetPay({ ...baseInputs, grossIncome: high, frequency: 'annual' }); 
      if (res.netAnnual >= targetAnnualNet) break;
      low = high;
      high *= 2;
      safety++;
  }

  let iterations = 0;
  let bestGross = high;
  
  // Binary Search
  while (low <= high && iterations < 50) {
      const mid = (low + high) / 2;
      const res = calculateNetPay({ ...baseInputs, grossIncome: mid, frequency: 'annual' });
      const diff = res.netAnnual - targetAnnualNet;

      if (Math.abs(diff) < 1) {
          bestGross = mid;
          break;
      }
      if (diff < 0) low = mid;
      else high = mid;
      
      bestGross = mid;
      iterations++;
  }
  return isMonthly ? bestGross / 12 : bestGross;
};
