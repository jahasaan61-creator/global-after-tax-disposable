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

  // --- SPECIAL LOGIC: Church Tax (Germany) ---
  // Church tax is unique: it's a % of the *Income Tax* amount, not the gross income.
  if (deductible.isChurchTax) {
    if (!details.churchTax) return 0;
    return accumulatedTax * (deductible.rate || 0.09);
  }

  // --- SPECIAL LOGIC: Age Based Rates (Singapore CPF) ---
  let effectiveRate = deductible.rate;
  if (deductible.ratesByAge && details.age) {
      const ageRule = deductible.ratesByAge.find(r => details.age > r.minAge && details.age <= r.maxAge);
      if (ageRule) {
          effectiveRate = ageRule.rate;
      }
  }

  // 1. Apply Income Cap (Wage Base)
  if (deductible.cappedBase && basis > deductible.cappedBase) {
    basis = deductible.cappedBase;
  }

  // 2. Apply Standard Deduction / Exempt Amount
  let exempt = deductible.exemptAmount || 0;
  
  // --- SPECIAL LOGIC: USA Married Filing Jointly Standard Deduction ---
  if (country === CountryCode.USA && details.maritalStatus === 'married' && deductible.name.includes('Federal Income')) {
      exempt = 29200; // 2024 Married Jointly Standard Deduction
  }

  basis = Math.max(0, basis - exempt);

  let computedAmount = 0;

  if (deductible.type === 'percentage' && effectiveRate) {
    computedAmount = basis * effectiveRate;
  } else if (deductible.type === 'progressive' && deductible.brackets) {
    
    // --- SPECIAL LOGIC: Germany Income Splitting (Ehegattensplitting) ---
    // For married couples, we halve the income, calculate tax, then double the tax.
    // Equivalent to doubling the bracket widths.
    let processingIncome = basis;
    let bracketsToUse = [...deductible.brackets];

    if (country === CountryCode.DEU && details.maritalStatus === 'married' && deductible.name.includes('Income Tax')) {
       processingIncome = basis / 2;
    }

    // --- SPECIAL LOGIC: USA Married Filing Jointly Brackets ---
    if (country === CountryCode.USA && details.maritalStatus === 'married' && deductible.name.includes('Federal Income')) {
        // Approximate 2024 Married Jointly Brackets (Roughly 2x Single width)
        bracketsToUse = [
            { threshold: 0, rate: 0.10 },
            { threshold: 23200, rate: 0.12 },
            { threshold: 94300, rate: 0.22 },
            { threshold: 201050, rate: 0.24 },
            { threshold: 383900, rate: 0.32 },
            { threshold: 487450, rate: 0.35 },
            { threshold: 731200, rate: 0.37 },
        ];
    }

    // --- SPECIAL LOGIC: Ireland Married Rate Band ---
    if (country === CountryCode.IRL && details.maritalStatus === 'married' && deductible.name.includes('PAYE')) {
        // Standard Rate cut-off increases to roughly 51,000 (depending on dual earner status, simplified here to 1 earner max benefit)
        bracketsToUse = [
            { threshold: 0, rate: 0.20 },
            { threshold: 51000, rate: 0.40 },
        ];
    }

    // Standard Progressive Logic
    const sortedBrackets = bracketsToUse.sort((a, b) => a.threshold - b.threshold);
    
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

    // Germany: Finish Splitting calculation (Double the result)
    if (country === CountryCode.DEU && details.maritalStatus === 'married' && deductible.name.includes('Income Tax')) {
        computedAmount *= 2;
    }
  }

  // 3. Apply Tax Credits
  // --- SPECIAL LOGIC: Ireland Married Tax Credits ---
  let credits = deductible.fixedCredits || 0;
  if (country === CountryCode.IRL && details.maritalStatus === 'married' && deductible.name.includes('PAYE')) {
      credits = 3750 + 1875; // Simplified: Personal (Married) + Employee credit
  }

  if (credits > 0) {
    computedAmount = Math.max(0, computedAmount - credits);
  }

  // 4. Apply Final Hard Cap
  if (deductible.cap && computedAmount > deductible.cap) {
    computedAmount = deductible.cap;
  }

  return computedAmount;
};

export const calculateNetPay = (inputs: UserInputs): CalculationResult => {
  const rules = COUNTRY_RULES[inputs.country];
  let grossAnnual = inputs.frequency === 'monthly' ? inputs.grossIncome * 12 : inputs.grossIncome;
  if (grossAnnual < 0) grossAnnual = 0;

  const deductionsBreakdown: DeductionResult[] = [];
  
  // We need to track Total Income Tax for Church Tax Calculation (Germany)
  let totalIncomeTax = 0;

  // 1. Federal Deductions
  rules.federalDeductibles.forEach(d => {
    const amount = calculateTaxAmount(grossAnnual, d, inputs, totalIncomeTax);
    
    // Track Income Tax for dependent taxes
    if (d.name.includes('Income Tax') || d.name.includes('Federal Income') || d.name.includes('PAYE')) {
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
    (inputs.costs.emergencyFund || 0);

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