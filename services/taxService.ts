
import { COUNTRY_RULES } from '../constants';
import { CalculationResult, Deductible, DeductionResult, UserInputs, CountryCode, TaxBracket } from '../types';

const calculateTaxAmount = (
    grossIncome: number, 
    deductible: Deductible, 
    inputs: UserInputs, 
    accumulatedTax: number,
    fiscalIncome?: number // For NLD credits which depend on fiscal income not base taxable
): number => {
  let basis = grossIncome;
  const { country, details } = inputs;
  const isMarried = details.maritalStatus === 'married';
  
  // For NLD 30% ruling, the basis for TAX is 70% of gross.
  // But for CREDITS, it depends on the rule. Usually credits are based on the fiscal income.
  // If this deductible is a credit, we should typically use the full fiscal income if not specified otherwise,
  // but for NLD 30% ruling, the 'partial non-resident' status means usually credits apply to the taxable part.
  // However, for simplicity and standard ruling application:
  // The 30% allowance reduces taxable income.
  if (country === CountryCode.NLD && details.isExpat && deductible.name.includes('Income Tax')) {
      basis = basis * 0.70;
  }

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
  if (deductible.cappedBase && basis > deductible.cappedBase) {
    basis = deductible.cappedBase;
  }

  // 3. Apply Standard Deduction / Exempt Amount
  let exempt = deductible.exemptAmount || 0;
  
  // Use Married exemption if available and applicable
  if (isMarried && deductible.exemptAmountMarried) {
      exempt = deductible.exemptAmountMarried;
  }

  // For progressive calculations, we subtract exempt amount first usually.
  // For credit_progressive, exemptAmount often acts as the BASE credit value.
  if (deductible.type !== 'credit_progressive') {
      basis = Math.max(0, basis - exempt);
  }

  let computedAmount = 0;

  if (deductible.type === 'percentage' && effectiveRate) {
    computedAmount = basis * effectiveRate;
  } 
  else if ((deductible.type === 'progressive' || deductible.type === 'credit_progressive') && (deductible.brackets || deductible.bracketsMarried)) {
    
    // --- SPECIAL LOGIC: Germany Income Splitting ---
    let processingIncome = basis;
    let multiplier = 1;

    if (country === CountryCode.DEU && isMarried && deductible.name.includes('Income Tax')) {
       processingIncome = basis / 2;
       multiplier = 2;
    }
    
    // For NLD Credits, use Fiscal Income (which respects 30% ruling reduction for tax purposes)
    // Actually for NLD credits, they decrease based on taxable income.
    if (country === CountryCode.NLD && deductible.type === 'credit_progressive' && fiscalIncome !== undefined) {
         // Use fiscal income (taxable income) for credit reduction calc
         processingIncome = fiscalIncome; 
    }

    // Select Brackets (Married vs Single)
    let bracketsToUse = deductible.brackets || [];
    if (isMarried && deductible.bracketsMarried) {
        bracketsToUse = deductible.bracketsMarried;
    }

    // Credit Logic:
    // 'progressive' = standard tax brackets (0-10k @ 10%, 10k-20k @ 20%)
    // 'credit_progressive' = usually a base amount minus a rate * (income - threshold).
    // OR it can be defined as brackets of accumulation/reduction.
    
    if (deductible.type === 'credit_progressive') {
         // Special handler for NLD-style credits defined in constants
         // Strategy: Start with exemptAmount (Base Credit)
         // Iterate brackets. If rate is positive, it REDUCES credit. If negative, it INCREASES credit (Labor credit build up).
         computedAmount = exempt;
         
         const sortedBrackets = [...bracketsToUse].sort((a, b) => a.threshold - b.threshold);
         for (let i = 0; i < sortedBrackets.length; i++) {
             const bracket = sortedBrackets[i];
             const nextBracket = sortedBrackets[i + 1];
             const bottom = bracket.threshold;
             const top = nextBracket ? nextBracket.threshold : Infinity;

             if (processingIncome > bottom) {
                 const incomeInBracket = Math.min(processingIncome, top) - bottom;
                 // For credits: rate * income is added/subtracted from base
                 computedAmount -= (incomeInBracket * bracket.rate); 
                 // Note: In constants, I used Positive Rate for General Credit (Reduction) -> Minus positive = Reduction
                 // I used Negative Rate for Labor Credit (Buildup) -> Minus negative = Addition
             }
         }
         // Ensure credit doesn't drop below zero
         computedAmount = Math.max(0, computedAmount);
    } else {
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
    }

    // Apply Germany Splitting Multiplier
    computedAmount *= multiplier;
  }

  // 4. Apply Tax Credits (Fixed)
  let credits = deductible.fixedCredits || 0;
  if (isMarried && deductible.fixedCreditsMarried) {
      credits = deductible.fixedCreditsMarried;
  }

  if (deductible.type !== 'credit_progressive') {
      if (credits > 0) {
        computedAmount = Math.max(0, computedAmount - credits);
      }
  }

  // 5. Apply Final Hard Cap
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

  // --- PRE-CALCULATION FOR SPECIFIC COUNTRIES ---
  // Determine "Fiscal Income" / "Taxable Income" base for the year
  let fiscalIncome = grossAnnual;
  if (inputs.country === CountryCode.NLD && inputs.details.isExpat) {
      fiscalIncome = grossAnnual * 0.7; // 30% Ruling
  }

  const deductionsBreakdown: DeductionResult[] = [];
  
  // Track Total Income Tax for Surcharges (Soli, Church Tax)
  let totalIncomeTax = 0;

  // 1. Federal Deductions
  let totalCredits = 0;

  rules.federalDeductibles.forEach(d => {
    const amount = calculateTaxAmount(grossAnnual, d, inputs, totalIncomeTax, fiscalIncome);
    
    if (d.type === 'credit_progressive') {
        totalCredits += amount;
        // Credits are negative deductions in the breakdown?
        // Or we just store them and subtract from final tax?
        // Better to list them as negative amounts for clarity.
         deductionsBreakdown.push({
            name: d.name,
            description: d.description,
            amount: -amount, // Negative because it's a credit
            isEmployer: false
        });
    } else {
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
    }
  });

  // 2. Sub-national Deductions
  if (inputs.subRegion && rules.subNationalRules) {
    const regionRule = rules.subNationalRules.find(r => r.id === inputs.subRegion);
    if (regionRule) {
      regionRule.deductibles.forEach(d => {
        const amount = calculateTaxAmount(grossAnnual, d, inputs, totalIncomeTax, fiscalIncome);
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

  // Sum deductions (Credits are negative in the array, so they reduce the sum)
  const totalEmployeeDeductionsAnnual = deductionsBreakdown
    .filter(d => !d.isEmployer)
    .reduce((sum, d) => sum + d.amount, 0);
    
  // Ensure we don't have negative total tax (refund) unless specific countries allow (usually not for basic calculator)
  // But credits might exceed tax in some edge cases. We'll floor at 0 for net pay calc generally, 
  // but some credits are refundable. Assuming non-refundable for general simplicity unless specified.
  // Actually, NLD credits are generally limited to tax amount.
  let finalDeductions = totalEmployeeDeductionsAnnual;
  if (inputs.country === CountryCode.NLD && finalDeductions < 0) {
      finalDeductions = 0; // Cap refund at 0 tax
  }

  const netAnnual = grossAnnual - finalDeductions;
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
    
  // --- MARGINAL RATE CALCULATION ---
  // Calculate tax for (Gross + 100). Difference / 100 = Marginal Rate.
  let marginalRate = 0;
  // Simple clone of inputs with +100 annual
  const marginalInputs = { ...inputs, grossIncome: inputs.grossIncome + 100, frequency: inputs.frequency }; // Force frequency match
  
  // Re-run logic (Simplified inline to avoid infinite recursion if we just called calculateNetPay completely)
  // Actually safe to call calculateNetPay recursively once? Yes.
  // But slightly inefficient. Let's just do a quick pass for federal tax which is usually the driver.
  // For accuracy, let's just do the logic:
  const grossPlus = grossAnnual + 100;
  
  let taxPlus = 0;
  // NLD Fiscal adjustment for marginal
  let fiscalPlus = grossPlus;
  if (inputs.country === CountryCode.NLD && inputs.details.isExpat) fiscalPlus = grossPlus * 0.7;
  
  let incomeTaxPlus = 0;
  rules.federalDeductibles.forEach(d => {
      const amt = calculateTaxAmount(grossPlus, d, inputs, incomeTaxPlus, fiscalPlus);
      if (d.type === 'credit_progressive') {
          taxPlus -= amt;
      } else {
          if(!d.isTaxSurcharge && d.name.includes('Income Tax')) incomeTaxPlus += amt;
          if(!d.employerPaid) taxPlus += amt;
      }
  });
  // Subnationals
  if (inputs.subRegion && rules.subNationalRules) {
      const rr = rules.subNationalRules.find(r => r.id === inputs.subRegion);
      if(rr) rr.deductibles.forEach(d => {
           if(!d.employerPaid) taxPlus += calculateTaxAmount(grossPlus, d, inputs, incomeTaxPlus, fiscalPlus);
      });
  }
  
  if (inputs.country === CountryCode.NLD && taxPlus < 0) taxPlus = 0;
  
  marginalRate = (taxPlus - finalDeductions) / 100;
  if (marginalRate < 0) marginalRate = 0;

  return {
    grossMonthly: grossAnnual / 12,
    grossAnnual,
    netMonthly,
    netAnnual,
    totalDeductionsMonthly: finalDeductions / 12,
    deductionsBreakdown,
    disposableMonthly: netMonthly - personalCostsMonthly,
    personalCostsTotal: personalCostsMonthly,
    marginalRate
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
