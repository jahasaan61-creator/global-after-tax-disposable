
export enum CountryCode {
  USA = 'USA',
  CHE = 'CHE', // Switzerland
  CAN = 'CAN',
  DEU = 'DEU', // Germany
  IRL = 'IRL', // Ireland
  NZL = 'NZL', // New Zealand
  NOR = 'NOR', // Norway
  SGP = 'SGP', // Singapore
  BGD = 'BGD', // Bangladesh
  ESP = 'ESP', // Spain
  GBR = 'GBR', // United Kingdom
  IND = 'IND', // India
  JPN = 'JPN', // Japan
  AUS = 'AUS', // Australia
  NLD = 'NLD', // Netherlands
}

export interface TaxBracket {
  threshold: number;
  rate: number;
  flatAmount?: number; 
}

export interface Deductible {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'progressive' | 'credit_progressive';
  rate?: number; 
  amount?: number; 
  brackets?: TaxBracket[]; 
  
  // Advanced Tax Logic
  cap?: number; // The maximum amount of DEDUCTION (tax paid)
  cappedBase?: number; // The maximum INCOME upon which tax is calculated (e.g. Social Security Wage Base)
  exemptAmount?: number; // Standard Deduction or 0% band
  fixedCredits?: number; // Tax Credits (subtracts from tax bill)
  
  // Married / Conditional Logic
  exemptAmountMarried?: number;
  bracketsMarried?: TaxBracket[];
  fixedCreditsMarried?: number;

  // Specific Flags
  employerPaid?: boolean; 
  isTaxSurcharge?: boolean; // Applies to the calculated Tax amount (e.g. Soli, Church) NOT Gross Income
  surchargeThreshold?: number; // Only apply if base tax amount > this
  
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
  exchangeRatePerUSD: number; 
  federalDeductibles: Deductible[];
  subNationalLabel?: string; 
  subNationalRules?: SubNationalRule[];
  sources: { label: string; url: string; date: string }[];
  
  // Context Flags
  hasMaritalStatusOption?: boolean;
  hasChurchTaxOption?: boolean;
  hasExpatOption?: boolean; // For 30% ruling
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
  marginalRate: number; 
}

export interface UserDetails {
  age: number;
  maritalStatus: 'single' | 'married';
  churchTax: boolean;
  isExpat?: boolean; 
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
    insurance: number;
    emergencyFund: number;
    debt: number;
    freedomFund: number;
  };
  details: UserDetails;
  annualBonus: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: string[];
}
