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
  flatAmount?: number; 
}

export interface Deductible {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'progressive';
  rate?: number; 
  amount?: number; 
  brackets?: TaxBracket[]; 
  
  // Advanced Tax Logic
  cap?: number; 
  cappedBase?: number; 
  exemptAmount?: number; 
  fixedCredits?: number; 
  
  // Specific Flags
  employerPaid?: boolean; 
  isChurchTax?: boolean; // Applied on the tax amount, not income
  
  // Dynamic Rates
  ratesByAge?: { minAge: number; maxAge: number; rate: number }[];
  
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
  subNationalLabel?: string; 
  subNationalRules?: SubNationalRule[];
  sources: { label: string; url: string; date: string }[];
  
  // Context Flags
  hasMaritalStatusOption?: boolean;
  hasChurchTaxOption?: boolean;
}

export interface DeductionResult {
  name: string;
  description?: string;
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

export interface UserDetails {
  age: number;
  maritalStatus: 'single' | 'married';
  churchTax: boolean;
}

export interface UserInputs {
  grossIncome: number;
  frequency: 'monthly' | 'annual';
  country: CountryCode;
  subRegion?: string; 
  costs: {
    rent: number;
    groceries: number;
    utilities: number;
    transport: number;
  };
  details: UserDetails;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: string[];
}