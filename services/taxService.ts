
import { COUNTRY_RULES } from '../constants';
import { CalculationResult, Deductible, DeductionResult, UserInputs, CountryCode, TaxBracket } from '../types';

const calculateTaxAmount = (
    baseAmount: number, // Can be Gross OR Taxable Income depending on 'useTaxableIncome' flag
    deductible: Deductible, 
    inputs: UserInputs, 
    accumulatedTax: number,
    fiscalIncome?: number
): number => {
  let basis = baseAmount;
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

  // Tapering Logic (e.g. UK Personal Allowance reduction)
  if (deductible.taperRule) {
     const incomeForTaper = fiscalIncome !== undefined ? fiscalIncome : inputs.grossIncome;
     if (incomeForTaper > deductible.taperRule.threshold) {
         const reduction = (incomeForTaper - deductible.taperRule.threshold) * deductible.taperRule.rate;
         exempt = Math.max(0, exempt - reduction);
     }
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
  
  // Track Taxable Income (reduced by social contributions in some countries)
  let currentTaxableIncome = grossAnnual;

  // 1. Federal Deductions
  rules.federalDeductibles.forEach(d => {
    // Canada QC Exception: Skip CPP, apply QPP later in subnational
    if (inputs.country === CountryCode.CAN && inputs.subRegion === 'QC' && d.name.includes('CPP')) {
        return;
    }
    
    // Determine the base for this calculation
    const calculationBase = d.useTaxableIncome ? currentTaxableIncome : grossAnnual;

    const amount = calculateTaxAmount(calculationBase, d, inputs, totalIncomeTax, fiscalIncome);
    
    if (d.type === 'credit_progressive') {
        // Credits reduce the tax bill. We display them as negative deductions.
         deductionsBreakdown.push({
            name: d.name,
            description: d.description,
            amount: -amount, 
            isEmployer: false
        });
    } else {
        // Accumulate Income Tax base for dependent taxes (like Church Tax or QC Abatement)
        if (!d.isTaxSurcharge && (d.name.includes('Income Tax') || d.name.includes('Federal Income') || d.name.includes('PAYE') || d.name.includes('Direct Federal') || d.name.includes('IRPF') || d.name.includes('IRPEF'))) {
            totalIncomeTax += amount;
        }
        
        // Reduce Taxable Income if applicable (e.g. Social Security in Germany/France or Reliefs)
        if (d.reducesTaxableIncome && amount > 0) {
            currentTaxableIncome = Math.max(0, currentTaxableIncome - amount);
        }

        // Push to breakdown unless it is a "Relief" (internal tax-free allowance)
        if (!d.isRelief) {
            if (amount !== 0 || d.employerPaid) { 
                if (amount !== 0) {
                    deductionsBreakdown.push({
                        name: d.name,
                        description: d.description,
                        amount: amount,
                        isEmployer: !!d.employerPaid
                    });
                }
            }
        }
    }
  });

  // 2. Sub-national Deductions
  if (inputs.subRegion && rules.subNationalRules) {
    const regionRule = rules.subNationalRules.find(r => r.id === inputs.subRegion);
    if (regionRule) {
      regionRule.deductibles.forEach(d => {
        // Sub-national rules also respect useTaxableIncome (e.g. Local taxes on net)
        const calculationBase = d.useTaxableIncome ? currentTaxableIncome : grossAnnual;
        
        const amount = calculateTaxAmount(calculationBase, d, inputs, totalIncomeTax, fiscalIncome);
        
        // Reduce Taxable Income if sub-national tax/relief reduces it
        if (d.reducesTaxableIncome && amount > 0) {
            currentTaxableIncome = Math.max(0, currentTaxableIncome - amount);
        }

        if (!d.isRelief && amount !== 0) { 
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
  
  // For marginal, we must replicate the taxable income chain
  let taxableIncomePlus = grossPlus;
  
  if (inputs.country === CountryCode.NLD && inputs.details.isExpat) fiscalPlus = grossPlus * 0.7;
  
  rules.federalDeductibles.forEach(d => {
      // Canada QC Exception for Marginal Calc
      if (inputs.country === CountryCode.CAN && inputs.subRegion === 'QC' && d.name.includes('CPP')) {
        return;
      }

      const base = d.useTaxableIncome ? taxableIncomePlus : grossPlus;
      const amt = calculateTaxAmount(base, d, inputs, incomeTaxPlus, fiscalPlus);
      
      if (d.reducesTaxableIncome) {
          taxableIncomePlus = Math.max(0, taxableIncomePlus - amt);
      }

      if (d.type === 'credit_progressive') {
          taxPlus -= amt;
      } else {
          if (!d.isRelief) {
              if (!d.isTaxSurcharge && (d.name.includes('Income Tax') || d.name.includes('PAYE'))) incomeTaxPlus += amt;
              if (!d.employerPaid) taxPlus += amt;
          }
      }
  });
  
  // Simplified marginal for sub-national (ignoring deep chaining for performance/complexity)
  if (inputs.subRegion && rules.subNationalRules) {
      const rr = rules.subNationalRules.find(r => r.id === inputs.subRegion);
      if(rr) rr.deductibles.forEach(d => {
           const base = d.useTaxableIncome ? taxableIncomePlus : grossPlus;
           const amt = calculateTaxAmount(base, d, inputs, incomeTaxPlus, fiscalPlus);
           if(!d.employerPaid && !d.isRelief) taxPlus += amt;
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
    netWeekly: netAnnual / 52,
    netBiWeekly: netAnnual / 26,
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
  let high = targetAnnualNet * 2.5; 
  
  let safety = 0;
  while (safety < 20) {
      const res = calculateNetPay({ ...baseInputs, grossIncome: high, frequency: 'annual' }); 
      if (res.netAnnual >= targetAnnualNet) break;
      low = high;
      high *= 1.5;
      safety++;
  }

  let iterations = 0;
  let bestGross = high;
  
  while (low <= high && iterations < 40) {
      const mid = (low + high) / 2;
      const res = calculateNetPay({ ...baseInputs, grossIncome: mid, frequency: 'annual' });
      const diff = res.netAnnual - targetAnnualNet;

      if (Math.abs(diff) < 2) { // Relaxed tolerance slightly
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
