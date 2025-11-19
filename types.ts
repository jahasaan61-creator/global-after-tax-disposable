export enum CountryCode {
  USA = 'USA',
  CHE = 'CHE', // Switzerland
  CAN = 'CAN',
  DEU = 'DEU', // Germany
  IRL = 'IRL', // Ireland
  NZL = 'NZL', // New Zealand
  NOR = 'NOR', // Norway
  SGP = 'SGP', // Singapore
}

export interface TaxBracket {
  threshold: number;
  rate: number;
  flatAmount?: number; // Some systems add a flat amount plus rate on excess
}

export interface Deductible {
  name: string;
  type: 'percentage' | 'fixed' | 'progressive';
  rate?: number; // For flat percentage
  amount?: number; // For fixed amount
  brackets?: TaxBracket[]; // For progressive
  
  // Advanced Tax Logic
  cap?: number; // Max amount deductible (Final value cap)
  cappedBase?: number; // Max income to apply rate to (Income cap, e.g. Social Security Wage Base)
  exemptAmount?: number; // Standard deduction / Tax free allowance deducted from income BEFORE rate
  fixedCredits?: number; // Fixed amount subtracted from the calculated tax (e.g. Ireland Tax Credits)
  
  employerPaid?: boolean; // Informational only
  sourceUrl?: string;
}

export interface SubNationalRule {
  id: string;
  name: string;
  deductibles: Deductible[];
}

export interface CountryRules {
  code: CountryCode;
  name: string;
  currency: string;
  currencySymbol: string;
  federalDeductibles: Deductible[];
  subNationalLabel?: string; // e.g., "State", "Canton", "Province"
  subNationalRules?: SubNationalRule[];
  sources: { label: string; url: string; date: string }[];
}

export interface DeductionResult {
  name: string;
  amount: number;
  isEmployer: boolean;
}

export interface CalculationResult {
  grossMonthly: number;
  grossAnnual: number;
  netMonthly: number;
  netAnnual: number;
  totalDeductionsMonthly: number;
  deductionsBreakdown: DeductionResult[];
  disposableMonthly: number;
  personalCostsTotal: number;
}

export interface UserInputs {
  grossIncome: number;
  frequency: 'monthly' | 'annual';
  country: CountryCode;
  subRegion?: string; // ID of state/canton
  costs: {
    rent: number;
    groceries: number;
    utilities: number;
    transport: number;
  };
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: string[];
}