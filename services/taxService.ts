import { COUNTRY_RULES } from '../constants';
import { CalculationResult, Deductible, DeductionResult, UserInputs } from '../types';

const calculateTaxAmount = (grossIncome: number, deductible: Deductible): number => {
  let basis = grossIncome;

  // 1. Apply Income Cap (Wage Base)
  // E.g. Social Security only applies to the first $168k
  if (deductible.cappedBase && basis > deductible.cappedBase) {
    basis = deductible.cappedBase;
  }

  // 2. Apply Standard Deduction / Exempt Amount
  // E.g. First $14,600 is tax free (USA) or Basic Personal Amount (Canada)
  // Note: Usually this applies to "Progressive" income tax, but sometimes flat taxes have exemptions.
  // If specific 'exemptAmount' is defined on the deductible, we use it.
  if (deductible.exemptAmount) {
    basis = Math.max(0, basis - deductible.exemptAmount);
  }

  let computedAmount = 0;

  if (deductible.type === 'percentage' && deductible.rate) {
    computedAmount = basis * deductible.rate;
  } else if (deductible.type === 'progressive' && deductible.brackets) {
    // Progressive Calculation
    // Brackets should be sorted by threshold
    const sortedBrackets = [...deductible.brackets].sort((a, b) => a.threshold - b.threshold);
    
    // In our constants, thresholds are usually 0, 11000, 45000 etc.
    // This implies the rate applies to income > threshold.
    // We need to calculate the chunk of income in each band.
    
    let remainingIncome = basis;
    let previousThreshold = 0;

    for (let i = 0; i < sortedBrackets.length; i++) {
      const bracket = sortedBrackets[i];
      const nextBracket = sortedBrackets[i + 1];
      
      // The width of this band
      // If it's the first bracket (threshold 0), it applies from 0 to next threshold.
      
      // Actually, standard bracket definitions:
      // 0     to 10,000 @ 10%
      // 10,000 to 20,000 @ 20%
      
      // Our format: { threshold: 0, rate: 0.10 }, { threshold: 10000, rate: 0.20 }
      
      // How much income falls into this bracket?
      const bottom = bracket.threshold;
      const top = nextBracket ? nextBracket.threshold : Infinity;
      
      if (basis > bottom) {
          const incomeInBracket = Math.min(basis, top) - bottom;
          computedAmount += incomeInBracket * bracket.rate;
      }
    }
  }

  // 3. Apply Tax Credits (Reduction of Tax Bill)
  // E.g. Ireland Tax Credits
  if (deductible.fixedCredits) {
    computedAmount = Math.max(0, computedAmount - deductible.fixedCredits);
  }

  // 4. Apply Final Hard Cap on the Tax Amount
  if (deductible.cap && computedAmount > deductible.cap) {
    computedAmount = deductible.cap;
  }

  return computedAmount;
};

export const calculateNetPay = (inputs: UserInputs): CalculationResult => {
  const rules = COUNTRY_RULES[inputs.country];
  let grossAnnual = inputs.frequency === 'monthly' ? inputs.grossIncome * 12 : inputs.grossIncome;
  
  // Ensure non-negative
  if (grossAnnual < 0) grossAnnual = 0;

  const deductionsBreakdown: DeductionResult[] = [];

  // 1. Federal Deductions
  rules.federalDeductibles.forEach(d => {
    const amount = calculateTaxAmount(grossAnnual, d);
    
    // Fix: 'isEmployer' property does not exist on type 'Deductible', used 'employerPaid' instead.
    if (amount > 0 || d.employerPaid) { // Keep employer items even if 0? usually > 0
      if (amount > 0) {
        deductionsBreakdown.push({
            name: d.name,
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
        const amount = calculateTaxAmount(grossAnnual, d);
        if (amount > 0) {
          deductionsBreakdown.push({
            name: `${regionRule.name} - ${d.name}`,
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
    (inputs.costs.transport || 0);

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