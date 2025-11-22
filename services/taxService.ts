
import { COUNTRY_RULES } from '../constants';
import { CalculationResult, Deductible, DeductionResult, UserInputs, CountryCode, TaxBracket } from '../types';

const calculateTaxAmount = (
    grossIncome: number, 
    deductible: Deductible, 
    inputs: UserInputs, 
    accumulatedTax: number,
    fiscalIncome?: number
): number => {
  let basis = grossIncome;
  const { country, details } = inputs;
  const isMarried = details.maritalStatus === 'married';
  
  // Expat / 30% Ruling Logic (NLD)
  // The ruling exempts 30% of gross salary from tax.
  if (country === CountryCode.NLD && details.isExpat && deductible.name.includes('Income Tax')) {
      basis = basis * 0.70;
  }

  // Saudi Arabia & UAE Expat Logic (No GOSI/GPSSA)
  if ((country === CountryCode.SAU || country === CountryCode.ARE) && details.isExpat && (deductible.name.includes('GOSI') || deductible.name.includes('GPSSA'))) {
      return 0;
  }

  // --- SURCHARGE LOGIC (Church Tax, Soli, etc) ---
  // These are calculated based on the 'accumulatedTax' (usually Income Tax), not the Gross Income.
  if (deductible.isTaxSurcharge) {
      // 1. Check boolean flag (e.g. Church Tax toggle)
      if (deductible.name.includes('Church') && !details.churchTax) {
          return 0;
      }
      
      // 2. Check threshold (e.g. Soli Freigrenze). 
      // If the underlying tax is below the threshold, surcharge is often 0.
      if (deductible.surchargeThreshold && accumulatedTax < deductible.surchargeThreshold) {
          return 0;
      }

      return accumulatedTax * (deductible.rate || 0);
  }

  // --- STANDARD LOGIC ---

  // 1. Apply Age-Based Rate adjustments
  let effectiveRate = deductible.rate;
  if (deductible.ratesByAge && details.age) {
      const ageRule = deductible.ratesByAge.find(r => details.age >= r.minAge && details.age <= r.maxAge);
      if (ageRule) {
          effectiveRate = ageRule.rate;
      }
  }

  // 2. Apply Income Cap (Wage Base)
  // e.g. US Social Security caps at $176,100 (2025)
  if (deductible.cappedBase && basis > deductible.cappedBase) {
    basis = deductible.cappedBase;
  }

  // 3. Apply Standard Deduction / Exempt Amount
  let exempt = deductible.exemptAmount || 0;
  if (isMarried && deductible.exemptAmountMarried) {
      exempt = deductible.exemptAmountMarried;
  }

  // For progressive calculations, we subtract exempt amount first.
  // (Unless it's a credit_progressive, where exempt usually acts as a base value).
  if (deductible.type !== 'credit_progressive') {
      basis = Math.max(0, basis - exempt);
  }

  let computedAmount = 0;

  if (deductible.type === 'percentage' && effectiveRate !== undefined) {
    computedAmount = basis * effectiveRate;
  }
  else if (deductible.type === 'fixed' && deductible.amount) {
    computedAmount = deductible.amount;
  }
  else if ((deductible.type === 'progressive' || deductible.type === 'credit_progressive') && (deductible.brackets || deductible.bracketsMarried)) {
    
    // --- SPECIAL LOGIC: Germany Income Splitting ---
    let processingIncome = basis;
    let multiplier = 1;

    // German Ehegattensplitting: Tax calculated on half income, then doubled.
    if (country === CountryCode.DEU && isMarried && deductible.name.includes('Income Tax')) {
       processingIncome = basis / 2;
       multiplier = 2;
    }
    
    // For NLD Credits, use Fiscal Income (which respects 30% ruling reduction for tax purposes)
    if (country === CountryCode.NLD && deductible.type === 'credit_progressive' && fiscalIncome !== undefined) {
         processingIncome = fiscalIncome; 
    }

    // Select Brackets (Married vs Single)
    let bracketsToUse = deductible.brackets || [];
    if (isMarried && deductible.bracketsMarried) {
        bracketsToUse = deductible.bracketsMarried;
    }

    if (deductible.type === 'credit_progressive') {
         // Credit Logic (e.g. NLD Heffingskorting):
         // Starts at a base 'exempt' amount, then reduces as income increases.
         computedAmount = exempt; // Base Credit
         
         const sortedBrackets = [...bracketsToUse].sort((a, b) => a.threshold - b.threshold);
         for (let i = 0; i < sortedBrackets.length; i++) {
             const bracket = sortedBrackets[i];
             const nextBracket = sortedBrackets[i + 1];
             const bottom = bracket.threshold;
             const top = nextBracket ? nextBracket.threshold : Infinity;

             if (processingIncome > bottom) {
                 const incomeInBracket = Math.min(processingIncome, top) - bottom;
                 // Rate is usually negative for reduction, or positive for addition
                 // In our constants, we define reduction rates as positive numbers to SUBTRACT.
                 // Or buildup rates (Labor Credit) as negative numbers to ADD (double negative).
                 computedAmount -= (incomeInBracket * bracket.rate); 
             }
         }
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

  // 5. Apply Final Hard Cap (if deduction amount itself is capped, e.g. max health premium)
  if (deductible.cap && computedAmount > deductible.cap) {
    computedAmount = deductible.cap;
  }

  return computedAmount;
};

export const calculateNetPay = (inputs: UserInputs): CalculationResult => {
  const rules = COUNTRY_RULES[inputs.country];
  let grossAnnual = inputs.frequency === 'monthly' ? inputs.grossIncome * 12 : inputs.grossIncome;
  
  if (inputs.annualBonus) {
    grossAnnual += inputs.annualBonus;
  }

  if (grossAnnual < 0) grossAnnual = 0;

  // --- PRE-CALCULATION FOR SPECIFIC COUNTRIES ---
  let fiscalIncome = grossAnnual;
  // NLD 30% Ruling: Taxable income is 70% of gross
  if (inputs.country === CountryCode.NLD && inputs.details.isExpat) {
      fiscalIncome = grossAnnual * 0.7; 
  }

  const deductionsBreakdown: DeductionResult[] = [];
  
  // Track Total Income Tax for Surcharges
  let totalIncomeTax = 0;

  // 1. Federal Deductions
  rules.federalDeductibles.forEach(d => {
    const amount = calculateTaxAmount(grossAnnual, d, inputs, totalIncomeTax, fiscalIncome);
    
    if (d.type === 'credit_progressive') {
        // Credits reduce the tax bill. We display them as negative deductions.
         deductionsBreakdown.push({
            name: d.name,
            description: d.description,
            amount: -amount, 
            isEmployer: false
        });
    } else {
        // Accumulate Income Tax base for dependent taxes (like Church Tax)
        if (!d.isTaxSurcharge && (d.name.includes('Income Tax') || d.name.includes('Federal Income') || d.name.includes('PAYE') || d.name.includes('Direct Federal'))) {
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

  // Sum deductions (Credits are negative, so they reduce the sum)
  let totalEmployeeDeductionsAnnual = deductionsBreakdown
    .filter(d => !d.isEmployer)
    .reduce((sum, d) => sum + d.amount, 0);
    
  // Prevent negative tax (Refunds generally capped at 0 for basic calculator)
  if (totalEmployeeDeductionsAnnual < 0) {
      totalEmployeeDeductionsAnnual = 0;
  }

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
    
  // --- MARGINAL RATE ESTIMATION ---
  let marginalRate = 0;
  const grossPlus = grossAnnual + 100;
  let taxPlus = 0;
  let incomeTaxPlus = 0;
  let fiscalPlus = grossPlus;
  
  if (inputs.country === CountryCode.NLD && inputs.details.isExpat) fiscalPlus = grossPlus * 0.7;
  
  rules.federalDeductibles.forEach(d => {
      const amt = calculateTaxAmount(grossPlus, d, inputs, incomeTaxPlus, fiscalPlus);
      if (d.type === 'credit_progressive') {
          taxPlus -= amt;
      } else {
          if (!d.isTaxSurcharge && (d.name.includes('Income Tax') || d.name.includes('PAYE'))) incomeTaxPlus += amt;
          if (!d.employerPaid) taxPlus += amt;
      }
  });

  if (inputs.subRegion && rules.subNationalRules) {
      const rr = rules.subNationalRules.find(r => r.id === inputs.subRegion);
      if(rr) rr.deductibles.forEach(d => {
           if(!d.employerPaid) taxPlus += calculateTaxAmount(grossPlus, d, inputs, incomeTaxPlus, fiscalPlus);
      });
  }
  
  if (taxPlus < 0) taxPlus = 0;
  
  marginalRate = (taxPlus - totalEmployeeDeductionsAnnual) / 100;
  if (marginalRate < 0) marginalRate = 0;

  return {
    grossMonthly: grossAnnual / 12,
    grossAnnual,
    netMonthly,
    netAnnual,
    totalDeductionsMonthly: totalEmployeeDeductionsAnnual / 12,
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
  
  let safety = 0;
  while (safety < 25) {
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