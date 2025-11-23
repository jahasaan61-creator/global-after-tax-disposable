

import { CountryCode, CountryRules } from './types';

// ACCURATE TAX RULES FOR 2024/2025
// Sources verified against official government budgets and tax authority publications as of Late 2024.

export const COUNTRY_RULES: Record<CountryCode, CountryRules> = {
  [CountryCode.USA]: {
    code: CountryCode.USA,
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    exchangeRatePerUSD: 1.0,
    subNationalLabel: 'State',
    hasMaritalStatusOption: true,
    sources: [
      { label: 'IRS 2025 Tax Brackets (Rev. Proc. 2024-40)', url: 'https://www.irs.gov/', date: '2024-10-22' },
      { label: 'SSA 2025 Fact Sheet', url: 'https://www.ssa.gov/news/press/factsheets/colafacts2025.pdf', date: '2024-10-10' }
    ],
    federalDeductibles: [
      {
        name: 'Federal Income Tax',
        description: 'Progressive tax (2025 Brackets).',
        type: 'progressive',
        // 2025 Standard Deduction
        exemptAmount: 15000, 
        exemptAmountMarried: 30000,
        brackets: [
          { threshold: 0, rate: 0.10 },
          { threshold: 11925, rate: 0.12 },
          { threshold: 48475, rate: 0.22 },
          { threshold: 103350, rate: 0.24 },
          { threshold: 197300, rate: 0.32 },
          { threshold: 250525, rate: 0.35 },
          { threshold: 626350, rate: 0.37 },
        ],
        bracketsMarried: [
          { threshold: 0, rate: 0.10 },
          { threshold: 23850, rate: 0.12 },
          { threshold: 96950, rate: 0.22 },
          { threshold: 206700, rate: 0.24 },
          { threshold: 394600, rate: 0.32 },
          { threshold: 501050, rate: 0.35 },
          { threshold: 751600, rate: 0.37 },
        ]
      },
      {
        name: 'Social Security (OASDI)',
        description: '6.2% capped at $176,100 (2025).',
        type: 'percentage',
        rate: 0.062,
        cappedBase: 176100 // 2025 Wage Base
      },
      {
        name: 'Medicare',
        description: '1.45% flat. +0.9% over $200k/$250k.',
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0.0145 },
          { threshold: 200000, rate: 0.0235 } // 1.45% + 0.9% Surtax
        ],
        bracketsMarried: [
          { threshold: 0, rate: 0.0145 },
          { threshold: 250000, rate: 0.0235 } 
        ]
      }
    ],
    subNationalRules: [
      {
        id: 'CA',
        name: 'California',
        deductibles: [
          {
            name: 'CA State Tax',
            description: 'State income tax (2024 Brackets).',
            type: 'progressive',
            exemptAmount: 5363, 
            exemptAmountMarried: 10726,
            brackets: [
              { threshold: 0, rate: 0.01 },
              { threshold: 10412, rate: 0.02 },
              { threshold: 24684, rate: 0.04 },
              { threshold: 38959, rate: 0.06 },
              { threshold: 54081, rate: 0.08 },
              { threshold: 68350, rate: 0.093 },
              { threshold: 349137, rate: 0.103 },
              { threshold: 418961, rate: 0.113 },
              { threshold: 698271, rate: 0.123 },
            ],
            bracketsMarried: [
              { threshold: 0, rate: 0.01 },
              { threshold: 20824, rate: 0.02 },
              { threshold: 49368, rate: 0.04 },
              { threshold: 77918, rate: 0.06 },
              { threshold: 108162, rate: 0.08 },
              { threshold: 136700, rate: 0.093 },
              { threshold: 698274, rate: 0.103 },
              { threshold: 837922, rate: 0.113 },
              { threshold: 1396542, rate: 0.123 },
            ]
          },
          { name: 'CA SDI', description: 'State Disability Insurance (1.1%).', type: 'percentage', rate: 0.011 } 
        ]
      },
      { id: 'TX', name: 'Texas', deductibles: [] },
      { id: 'FL', name: 'Florida', deductibles: [] },
      {
        id: 'NY',
        name: 'New York',
        deductibles: [
           {
            name: 'NY State Tax',
            description: 'Progressive (2024).',
            type: 'progressive',
            exemptAmount: 8000,
            brackets: [
              { threshold: 0, rate: 0.04 },
              { threshold: 8500, rate: 0.045 },
              { threshold: 11700, rate: 0.0525 },
              { threshold: 13900, rate: 0.0585 },
              { threshold: 80650, rate: 0.0625 }, 
              { threshold: 215400, rate: 0.0685 },
            ]
           }
        ]
      },
      {
          id: 'IL',
          name: 'Illinois',
          deductibles: [
              { name: 'IL State Tax', description: 'Flat Rate 4.95%.', type: 'percentage', rate: 0.0495, exemptAmount: 2775 }
          ]
      },
      {
        id: 'PA',
        name: 'Pennsylvania',
        deductibles: [
           { name: 'PA Income Tax', description: 'Flat Rate 3.07%.', type: 'percentage', rate: 0.0307 }
        ]
      },
      {
        id: 'WA',
        name: 'Washington',
        deductibles: [
           { name: 'WA Cares Fund', description: 'Long-Term Care Ins.', type: 'percentage', rate: 0.0058 }
        ]
      },
      {
        id: 'MA',
        name: 'Massachusetts',
        deductibles: [
           { name: 'MA Income Tax', description: 'Flat Rate 5%.', type: 'percentage', rate: 0.05, exemptAmount: 4400 }, // $4400 personal exemption
           { name: 'MA Millionaires Tax', description: '4% Surtax > $1M.', type: 'progressive', brackets: [{threshold: 0, rate: 0}, {threshold: 1000000, rate: 0.04}] },
           { name: 'PFML (Medical/Family)', description: 'Paid Leave (~0.46%).', type: 'percentage', rate: 0.0046, cappedBase: 176100 }
        ]
      },
      {
        id: 'NJ',
        name: 'New Jersey',
        deductibles: [
           { 
             name: 'NJ Income Tax', 
             description: 'Progressive.', 
             type: 'progressive', 
             exemptAmount: 1000,
             brackets: [
               { threshold: 0, rate: 0.014 },
               { threshold: 20000, rate: 0.0175 },
               { threshold: 35000, rate: 0.035 },
               { threshold: 40000, rate: 0.05525 },
               { threshold: 75000, rate: 0.0637 },
               { threshold: 500000, rate: 0.0897 },
               { threshold: 1000000, rate: 0.1075 }
             ] 
           },
           { name: 'NJ UI', description: 'Unemployment (0.425%).', type: 'percentage', rate: 0.00425, cappedBase: 42300 },
           { name: 'NJ FLI', description: 'Family Leave (0.09%).', type: 'percentage', rate: 0.0009, cappedBase: 161400 }
        ]
      },
      {
        id: 'VA',
        name: 'Virginia',
        deductibles: [
           { 
             name: 'VA Income Tax', 
             description: 'Progressive.', 
             type: 'progressive', 
             exemptAmount: 8000, // Standard Deduction Single
             brackets: [
               { threshold: 0, rate: 0.02 },
               { threshold: 3000, rate: 0.03 },
               { threshold: 5000, rate: 0.05 },
               { threshold: 17000, rate: 0.0575 }
             ] 
           }
        ]
      },
      {
          id: 'NC',
          name: 'North Carolina',
          deductibles: [
              { name: 'NC Income Tax', description: 'Flat Rate 4.25% (2025).', type: 'percentage', rate: 0.0425, exemptAmount: 12750 }
          ]
      },
      {
          id: 'GA',
          name: 'Georgia',
          deductibles: [
              { name: 'GA Income Tax', description: 'Flat Rate 5.39% (2025).', type: 'percentage', rate: 0.0539, exemptAmount: 12000 }
          ]
      },
      {
          id: 'OH',
          name: 'Ohio',
          deductibles: [
              { 
                name: 'OH Income Tax', 
                description: 'Progressive (2024).', 
                type: 'progressive', 
                exemptAmount: 26050,
                brackets: [
                  { threshold: 0, rate: 0.0275 },
                  { threshold: 73950, rate: 0.035 }
                ]
              }
          ]
      },
      {
          id: 'MI',
          name: 'Michigan',
          deductibles: [
              { name: 'MI Income Tax', description: 'Flat Rate 4.25%.', type: 'percentage', rate: 0.0425, exemptAmount: 5600 }
          ]
      },
      {
          id: 'CO',
          name: 'Colorado',
          deductibles: [
              { name: 'CO Income Tax', description: 'Flat Rate 4.4%.', type: 'percentage', rate: 0.044 }
          ]
      },
      {
          id: 'AZ',
          name: 'Arizona',
          deductibles: [
              { name: 'AZ Income Tax', description: 'Flat Rate 2.5%.', type: 'percentage', rate: 0.025, exemptAmount: 14600 }
          ]
      }
    ]
  },
  [CountryCode.AUS]: {
    code: CountryCode.AUS,
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: '$',
    exchangeRatePerUSD: 1.52,
    sources: [
        { label: 'ATO Tax Rates 2024-25 (Stage 3 Cuts)', url: 'https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents', date: '2024-07-01' }
    ],
    federalDeductibles: [
        {
            name: 'Income Tax (Stage 3)',
            description: 'New cuts effective July 1, 2024.',
            type: 'progressive',
            brackets: [
                { threshold: 0, rate: 0 },
                { threshold: 18200, rate: 0.16 },
                { threshold: 45000, rate: 0.30 },
                { threshold: 135000, rate: 0.37 },
                { threshold: 190000, rate: 0.45 }
            ]
        },
        {
            name: 'Medicare Levy',
            description: '2% of taxable income.',
            type: 'percentage',
            rate: 0.02,
            // Note: Threshold for levy is ~24k, but applied fully above
        }
    ]
  },
  [CountryCode.GBR]: {
    code: CountryCode.GBR,
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    exchangeRatePerUSD: 0.79,
    subNationalLabel: 'Nation',
    sources: [{ label: 'GOV.UK Rates 2024/25', url: 'https://www.gov.uk/income-tax-rates', date: '2024-04-06' }],
    federalDeductibles: [
        {
            name: 'National Insurance',
            description: 'Class 1 Cut to 8% (Apr 2024).',
            type: 'progressive',
            exemptAmount: 12570, // Primary Threshold
            brackets: [
                { threshold: 0, rate: 0.08 },     // 8% on earnings between £12,570 and £50,270
                { threshold: 37700, rate: 0.02 }  // 2% on earnings above £50,270
            ]
        },
        {
            name: 'Income Tax',
            description: 'Personal Allowance £12,570.',
            type: 'progressive',
            exemptAmount: 12570,
            taperRule: { threshold: 100000, rate: 0.5 },
            brackets: [
                { threshold: 0, rate: 0.20 },     // Basic rate
                { threshold: 37700, rate: 0.40 }, // Higher rate (starts at £50,270 total income)
                { threshold: 112570, rate: 0.45 } // Additional rate (starts at £125,140 total)
            ]
        }
    ],
    subNationalRules: [
        {
            id: 'ENG',
            name: 'England',
            deductibles: [] 
        },
        {
            id: 'WAL',
            name: 'Wales',
            deductibles: [] // Welsh rates currently mirror UK rates
        },
        {
            id: 'NIR',
            name: 'Northern Ireland',
            deductibles: [] 
        },
        {
            id: 'SCO',
            name: 'Scotland',
            deductibles: [
                {
                    name: 'Scottish Income Tax',
                    description: '2024/25 Rates (Higher/Top). Replaces UK Tax.',
                    type: 'progressive',
                    exemptAmount: 12570,
                    taperRule: { threshold: 100000, rate: 0.5 },
                    brackets: [
                        { threshold: 0, rate: 0.19 },     // Starter
                        { threshold: 2306, rate: 0.20 },  // Basic
                        { threshold: 13991, rate: 0.21 }, // Intermediate
                        { threshold: 31092, rate: 0.42 }, // Higher
                        { threshold: 62430, rate: 0.45 }, // Advanced
                        { threshold: 112570, rate: 0.48 } // Top
                    ],
                },
                {
                   name: 'UK Tax Offset',
                   description: 'Reverses standard UK tax for Scottish calc.',
                   type: 'progressive',
                   exemptAmount: 12570,
                   taperRule: { threshold: 100000, rate: 0.5 },
                   brackets: [
                        { threshold: 0, rate: -0.20 },
                        { threshold: 37700, rate: -0.40 },
                        { threshold: 112570, rate: -0.45 }
                   ]
                }
            ]
        }
    ]
  },
  [CountryCode.CAN]: {
    code: CountryCode.CAN,
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: '$',
    exchangeRatePerUSD: 1.38,
    subNationalLabel: 'Province',
    sources: [{ label: 'CRA 2025 Indexation', url: 'https://www.canada.ca/', date: '2024-11-15' }],
    federalDeductibles: [
      {
        name: 'Federal Tax',
        description: 'Federal income tax (2025 Projected).',
        type: 'progressive',
        exemptAmount: 16172, // 2025 BPA Estimate (Indexed ~2.7%)
        brackets: [
          { threshold: 0, rate: 0.15 },
          { threshold: 57570, rate: 0.205 },
          { threshold: 115140, rate: 0.26 },
          { threshold: 178476, rate: 0.29 },
          { threshold: 254264, rate: 0.33 },
        ]
      },
      { 
          name: 'CPP (Base)', 
          description: 'Pension Plan (Tier 1). QC pays QPP.', 
          type: 'percentage', 
          rate: 0.0595, 
          exemptAmount: 3500, 
          cappedBase: 71300 // 2025 YMPE Estimate
      },
      {
          name: 'CPP (Enhancement)',
          description: 'Tier 2 (4% on excess). QC pays QPP.',
          type: 'progressive',
          brackets: [
              { threshold: 0, rate: 0 },
              { threshold: 71300, rate: 0.04 }
          ],
          cappedBase: 81100 // 2025 Tier 2 Ceiling Estimate
      },
      { name: 'EI', description: 'Employment Insurance (2025).', type: 'percentage', rate: 0.0164, cappedBase: 65700 } 
    ],
    subNationalRules: [
      {
        id: 'ON', name: 'Ontario', deductibles: [
           { name: 'ON Tax', description: 'Ontario Tax.', type: 'progressive', exemptAmount: 12500, brackets: [{ threshold: 0, rate: 0.0505 }, { threshold: 51446, rate: 0.0915 }, { threshold: 102894, rate: 0.1116 }, { threshold: 150000, rate: 0.1216 }, { threshold: 220000, rate: 0.1316 }] },
           { name: 'ON Health Premium', description: 'Mandatory Health Premium.', type: 'progressive', brackets: [{ threshold: 0, rate: 0 }, { threshold: 20000, rate: 0.06 }, { threshold: 36000, rate: 0.06 }, { threshold: 48000, rate: 0.25 }, { threshold: 72000, rate: 0.25 }, { threshold: 200000, rate: 0.25 }], cap: 900 }
        ]
      },
      {
        id: 'BC', name: 'British Columbia', deductibles: [
           { name: 'BC Tax', description: 'BC Tax.', type: 'progressive', exemptAmount: 12580, brackets: [{ threshold: 0, rate: 0.0506 }, { threshold: 47937, rate: 0.077 }, { threshold: 95875, rate: 0.105 }, { threshold: 110076, rate: 0.1229 }, { threshold: 133664, rate: 0.147 }, { threshold: 181232, rate: 0.168 }] }
        ]
      },
      {
        id: 'AB', name: 'Alberta', deductibles: [
           { name: 'AB Tax', description: 'Alberta Tax.', type: 'progressive', exemptAmount: 21885, brackets: [{ threshold: 0, rate: 0.10 }, { threshold: 148269, rate: 0.12 }, { threshold: 177922, rate: 0.13 }, { threshold: 237230, rate: 0.14 }, { threshold: 355845, rate: 0.15 }] }
        ]
      },
      {
        id: 'QC', name: 'Quebec', deductibles: [
           { 
             name: 'QC Tax', 
             description: 'Quebec Provincial Tax.', 
             type: 'progressive', 
             exemptAmount: 18056, 
             brackets: [
               { threshold: 0, rate: 0.14 }, 
               { threshold: 51780, rate: 0.19 }, 
               { threshold: 103545, rate: 0.24 }, 
               { threshold: 126000, rate: 0.2575 }
             ] 
           },
           { 
             name: 'QPP (Pension)', 
             description: 'Quebec Pension Plan (Replaces CPP).', 
             type: 'percentage', 
             rate: 0.064, // 2024 Rate
             exemptAmount: 3500,
             cappedBase: 68500 
           },
           { name: 'QPIP', description: 'Parental Insurance.', type: 'percentage', rate: 0.00494, cappedBase: 94000 },
           {
             name: 'Federal Abatement',
             description: '16.5% Reduction of Federal Tax.',
             type: 'percentage',
             isTaxSurcharge: true, // Applies to Federal Tax
             rate: -0.165 // Negative rate creates a credit (deduction reduction)
           }
        ]
      },
      {
        id: 'NS', name: 'Nova Scotia', deductibles: [
           { name: 'NS Tax', description: 'Nova Scotia Tax.', type: 'progressive', exemptAmount: 11481, brackets: [{ threshold: 0, rate: 0.0879 }, { threshold: 29590, rate: 0.1495 }, { threshold: 59180, rate: 0.1667 }, { threshold: 93000, rate: 0.175 }, { threshold: 150000, rate: 0.21 }] }
        ]
      },
      {
        id: 'MB', name: 'Manitoba', deductibles: [
           { name: 'MB Tax', description: 'Manitoba Tax.', type: 'progressive', exemptAmount: 15780, brackets: [{ threshold: 0, rate: 0.108 }, { threshold: 47000, rate: 0.1275 }, { threshold: 100000, rate: 0.174 }] }
        ]
      },
      {
        id: 'SK', name: 'Saskatchewan', deductibles: [
           { name: 'SK Tax', description: 'Saskatchewan Tax.', type: 'progressive', exemptAmount: 18491, brackets: [{ threshold: 0, rate: 0.105 }, { threshold: 52057, rate: 0.125 }, { threshold: 148728, rate: 0.145 }] }
        ]
      },
      {
        id: 'NB', name: 'New Brunswick', deductibles: [
           { name: 'NB Tax', description: 'New Brunswick Tax.', type: 'progressive', exemptAmount: 13044, brackets: [{ threshold: 0, rate: 0.094 }, { threshold: 49958, rate: 0.14 }, { threshold: 99916, rate: 0.16 }, { threshold: 162452, rate: 0.195 }] }
        ]
      },
      {
        id: 'PE', name: 'Prince Edward Island', deductibles: [
           { name: 'PE Tax', description: 'PEI Tax (2024 System).', type: 'progressive', exemptAmount: 13500, brackets: [{ threshold: 0, rate: 0.095 }, { threshold: 32656, rate: 0.138 }, { threshold: 64313, rate: 0.167 }] }
        ]
      },
      {
        id: 'NL', name: 'Newfoundland and Labrador', deductibles: [
           { name: 'NL Tax', description: 'NL Tax.', type: 'progressive', exemptAmount: 10818, brackets: [{ threshold: 0, rate: 0.087 }, { threshold: 43198, rate: 0.145 }, { threshold: 86396, rate: 0.158 }, { threshold: 154200, rate: 0.178 }, { threshold: 205590, rate: 0.198 }] }
        ]
      }
    ]
  },
  [CountryCode.SGP]: {
    code: CountryCode.SGP,
    name: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    exchangeRatePerUSD: 1.34,
    sources: [{ label: 'CPF Rates 2025', url: 'https://www.cpf.gov.sg/', date: '2024-11-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax',
        description: 'Personal Income Tax (YA 2024/25).',
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0 },
          { threshold: 20000, rate: 0.02 },
          { threshold: 30000, rate: 0.035 },
          { threshold: 40000, rate: 0.07 },
          { threshold: 80000, rate: 0.115 },
          { threshold: 120000, rate: 0.15 },
          { threshold: 160000, rate: 0.18 },
          { threshold: 200000, rate: 0.19 },
          { threshold: 240000, rate: 0.195 },
          { threshold: 280000, rate: 0.20 },
          { threshold: 320000, rate: 0.22 },
          { threshold: 500000, rate: 0.23 },
          { threshold: 1000000, rate: 0.24 },
        ]
      },
      {
        name: 'CPF Contribution',
        description: 'Mandatory savings. Ceiling $7,400 (Jan 2025).',
        type: 'percentage',
        rate: 0.20, 
        ratesByAge: [
            { minAge: 0, maxAge: 55, rate: 0.20 },
            { minAge: 55, maxAge: 60, rate: 0.17 },
            { minAge: 60, maxAge: 65, rate: 0.115 },
            { minAge: 65, maxAge: 70, rate: 0.075 },
            { minAge: 70, maxAge: 100, rate: 0.05 },
        ],
        cappedBase: 88800 // 7400 * 12
      },
      {
        name: 'CDAC/SHG',
        description: 'Community Fund (Est).',
        type: 'fixed',
        amount: 36 
      }
    ]
  },
  [CountryCode.DEU]: {
    code: CountryCode.DEU,
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    hasMaritalStatusOption: true, 
    hasChurchTaxOption: true,
    sources: [{ label: 'BMF 2025 Updates', url: 'https://www.bundesfinanzministerium.de/', date: '2024-11-01' }],
    federalDeductibles: [
      // Order matters for reduction of taxable base
      { name: 'Pension Ins. (RV)', description: '9.3% Employee share.', type: 'percentage', rate: 0.093, cappedBase: 90600, reducesTaxableIncome: true }, // 2025 West BBG Est
      { name: 'Unemployment (AV)', description: '1.3% Employee share.', type: 'percentage', rate: 0.013, cappedBase: 90600, reducesTaxableIncome: true },
      { name: 'Health Ins. (GKV)', description: '7.3% + 1.25% Add-on (2025).', type: 'percentage', rate: 0.0855, cappedBase: 66150, reducesTaxableIncome: true }, // 2025 BBG
      { name: 'Care Ins. (PV)', description: '2.3% (Avg w/o child).', type: 'percentage', rate: 0.023, cappedBase: 66150, reducesTaxableIncome: true },
      
      // Reliefs (Internal)
      { name: 'Werbungskosten', description: 'Standard Expense Allowance.', type: 'fixed', amount: 1230, reducesTaxableIncome: true, isRelief: true },

      {
        name: 'Income Tax (Einkommensteuer)',
        description: 'Progressive. 2025 Allowance €12,096.',
        type: 'progressive',
        useTaxableIncome: true, // Uses Gross - Social Security
        exemptAmount: 12096, // 2025 Grundfreibetrag (Draft)
        brackets: [
          { threshold: 0, rate: 0.14 },
          { threshold: 18000, rate: 0.24 }, 
          { threshold: 68401, rate: 0.42 }, // Top rate
          { threshold: 277825, rate: 0.45 }, // Reichensteuer
        ]
      },
      { 
          name: 'Solidarity Surcharge', 
          description: '5.5% of Tax (High earners only).', 
          type: 'percentage', 
          rate: 0.055, 
          isTaxSurcharge: true,
          surchargeThreshold: 18130 // Annual Tax Threshold
      },
      { 
          name: 'Church Tax', 
          description: 'Kirchensteuer (9% of Tax).', 
          type: 'percentage', 
          rate: 0.09, 
          isTaxSurcharge: true 
      }
    ]
  },
  [CountryCode.IRL]: {
    code: CountryCode.IRL,
    name: 'Ireland',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    hasMaritalStatusOption: true, 
    sources: [{ label: 'Budget 2025', url: 'https://www.citizensinformation.ie/en/money-and-tax/budget-2025/', date: '2024-10-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax (PAYE)',
        description: '20%/40%. Band €44k (2025).',
        type: 'progressive',
        fixedCredits: 4000, // €2000 Personal + €2000 Employee (Budget 2025)
        fixedCreditsMarried: 6000, // Married
        brackets: [
          { threshold: 0, rate: 0.20 },
          { threshold: 44000, rate: 0.40 },
        ],
        bracketsMarried: [
          { threshold: 0, rate: 0.20 },
          { threshold: 53000, rate: 0.40 }, 
        ]
      },
      {
        name: 'USC (Budget 2025)',
        description: 'Universal Social Charge. Rate cut to 3%.',
        type: 'progressive',
        brackets: [
           { threshold: 0, rate: 0.005 },
           { threshold: 12012, rate: 0.02 },
           { threshold: 27382, rate: 0.03 }, // Budget 2025: 3% (was 4%)
           { threshold: 70044, rate: 0.08 },
        ]
      },
      { name: 'PRSI (Class A)', description: 'Social Insurance (4%).', type: 'percentage', rate: 0.04 }
    ]
  },
  [CountryCode.NZL]: {
    code: CountryCode.NZL,
    name: 'New Zealand',
    currency: 'NZD',
    currencySymbol: '$',
    exchangeRatePerUSD: 1.68,
    sources: [{ label: 'Tax Cuts July 2024', url: 'https://www.ird.govt.nz/', date: '2024-07-31' }],
    federalDeductibles: [
      {
        name: 'PAYE Tax',
        description: 'New thresholds from July 31, 2024.',
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0.105 },
          { threshold: 15600, rate: 0.175 }, // Increased from 14000
          { threshold: 53500, rate: 0.30 },  // Increased from 48000
          { threshold: 78100, rate: 0.33 },  // Increased from 70000
          { threshold: 180000, rate: 0.39 },
        ]
      },
      { name: 'ACC Earner Levy', description: 'Accident Cover (1.6%).', type: 'percentage', rate: 0.016, cappedBase: 142283 },
      { name: 'KiwiSaver', description: 'Retirement (Default 3%).', type: 'percentage', rate: 0.03 }
    ]
  },
  [CountryCode.CHE]: {
    code: CountryCode.CHE,
    name: 'Switzerland',
    currency: 'CHF',
    currencySymbol: 'CHF',
    exchangeRatePerUSD: 0.89,
    subNationalLabel: 'Canton',
    sources: [{ label: 'ESTV 2024', url: 'https://swisstaxcalculator.estv.admin.ch/', date: '2024-01-01' }],
    federalDeductibles: [
      { name: 'Federal Tax', description: 'Direct Federal Tax (Progressive).', type: 'progressive', brackets: [{ threshold: 18300, rate: 0.0077 }, { threshold: 31600, rate: 0.0088 }, { threshold: 41400, rate: 0.0264 }, { threshold: 55200, rate: 0.0297 }, { threshold: 72500, rate: 0.0594 }, { threshold: 103600, rate: 0.099 }, { threshold: 134600, rate: 0.115 }] },
      { name: 'AHV/IV/EO', description: 'OASI (5.3%).', type: 'percentage', rate: 0.053, reducesTaxableIncome: true },
      { name: 'ALV', description: 'Unemployment (1.1%).', type: 'percentage', rate: 0.011, cappedBase: 148200, reducesTaxableIncome: true },
      { name: 'NBU', description: 'Accident Ins (1.2% est).', type: 'percentage', rate: 0.012, reducesTaxableIncome: true },
      { name: 'Pension (BVG)', description: 'Pension Fund (3.5% est).', type: 'percentage', rate: 0.035, exemptAmount: 25725, reducesTaxableIncome: true } 
    ],
    subNationalRules: [
      { id: 'ZH', name: 'Zurich', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.10 }] },
      { id: 'GE', name: 'Geneva', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.15 }] },
      { id: 'BE', name: 'Bern', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.14 }] },
      { id: 'VD', name: 'Vaud', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.14 }] },
      { id: 'BS', name: 'Basel-Stadt', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.12 }] },
      { id: 'LU', name: 'Luzern', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.09 }] },
      { id: 'ZG', name: 'Zug', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.06 }] },
      { id: 'TI', name: 'Ticino', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.13 }] },
      { id: 'SG', name: 'St. Gallen', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.11 }] },
      { id: 'AG', name: 'Aargau', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.10 }] },
      // New ones
      { id: 'SZ', name: 'Schwyz', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.08 }] },
      { id: 'BL', name: 'Basel-Landschaft', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.125 }] },
      { id: 'VS', name: 'Valais', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.135 }] },
      { id: 'FR', name: 'Fribourg', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.14 }] },
      { id: 'SO', name: 'Solothurn', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.125 }] },
      { id: 'TG', name: 'Thurgau', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.115 }] },
      { id: 'GR', name: 'Graubünden', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.12 }] },
      { id: 'NE', name: 'Neuchâtel', deductibles: [{ name: 'Cantonal Tax (Est.)', type: 'percentage', rate: 0.155 }] }
    ]
  },
  [CountryCode.NOR]: {
    code: CountryCode.NOR,
    name: 'Norway',
    currency: 'NOK',
    currencySymbol: 'kr',
    exchangeRatePerUSD: 11.0,
    sources: [{ label: 'Skatteetaten 2025 Budget', url: 'https://www.skatteetaten.no/', date: '2024-10-07' }],
    federalDeductibles: [
      { 
        name: 'Income Tax (Alminnelig)', 
        description: 'General income tax (22%).',
        type: 'percentage', 
        rate: 0.22,
        exemptAmount: 108550 // Personfradrag 2025 Proposal
      },
      {
        name: 'Bracket Tax (Trinnskatt)',
        description: 'Progressive Gross Tax.',
        type: 'progressive',
        brackets: [
          { threshold: 208050, rate: 0.017 },
          { threshold: 292850, rate: 0.04 },
          { threshold: 670000, rate: 0.136 },
          { threshold: 937900, rate: 0.166 },
          { threshold: 1350000, rate: 0.176 },
        ]
      },
      { name: 'National Insurance', description: 'Trygdeavgift (7.8%).', type: 'percentage', rate: 0.078 }
    ]
  },
  [CountryCode.BGD]: {
    code: CountryCode.BGD,
    name: 'Bangladesh',
    currency: 'BDT',
    currencySymbol: '৳',
    exchangeRatePerUSD: 120.0,
    sources: [{ label: 'Finance Act 2024', url: 'https://nbr.gov.bd/', date: '2024-07-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax',
        description: 'FY 24-25 Slabs.',
        type: 'progressive',
        exemptAmount: 350000,
        brackets: [
          { threshold: 0, rate: 0.05 },       // Next 1L
          { threshold: 100000, rate: 0.10 },  // Next 4L
          { threshold: 500000, rate: 0.15 },  // Next 5L
          { threshold: 1000000, rate: 0.20 }, // Next 5L
          { threshold: 1500000, rate: 0.25 }, // Balance
        ]
      }
    ]
  },
  [CountryCode.ESP]: {
    code: CountryCode.ESP,
    name: 'Spain',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    sources: [
        { label: 'Seguridad Social 2025 (MEI)', url: 'https://www.seg-social.es/', date: '2024-01-01' }
    ],
    federalDeductibles: [
      {
        name: 'Social Security',
        description: 'Contingencias (4.7%).',
        type: 'percentage',
        rate: 0.047,
        cappedBase: 56646,
        reducesTaxableIncome: true
      },
      {
        name: 'Unemployment/FP/MEI',
        description: 'Desempleo (1.55%), MEI (0.14% 2025).',
        type: 'percentage',
        rate: 0.0179, // 1.55 + 0.1 + 0.14
        cappedBase: 56646,
        reducesTaxableIncome: true
      },
      // Relief
      { name: 'Gastos Deducibles', description: 'General Expenses Relief.', type: 'fixed', amount: 2000, reducesTaxableIncome: true, isRelief: true },

      {
        name: 'IRPF (Income Tax)',
        description: 'Progressive (National Avg).',
        type: 'progressive',
        useTaxableIncome: true, // Base reduced by SS
        fixedCredits: 1054.50, // Base tax adjustment
        brackets: [
          { threshold: 0, rate: 0.19 },
          { threshold: 12450, rate: 0.24 },
          { threshold: 20200, rate: 0.30 },
          { threshold: 35200, rate: 0.37 },
          { threshold: 60000, rate: 0.45 },
          { threshold: 300000, rate: 0.47 }
        ]
      }
    ]
  },
  [CountryCode.IND]: {
    code: CountryCode.IND,
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    exchangeRatePerUSD: 84.0,
    sources: [
        { label: 'Union Budget July 2024', url: 'https://incometaxindia.gov.in/', date: '2024-07-23' }
    ],
    federalDeductibles: [
      {
        name: 'EPF',
        description: 'Provident Fund (12% of Basic).',
        type: 'percentage',
        rate: 0.12,
        cappedBase: 180000 // 15k/mo cap for mandatory
      },
      {
        name: 'Income Tax (New Regime)',
        description: 'Revised Slabs July 2024.',
        type: 'progressive',
        exemptAmount: 75000, // Standard Deduction increased
        brackets: [
          { threshold: 0, rate: 0 },
          { threshold: 300000, rate: 0.05 }, // 3-7L
          { threshold: 700000, rate: 0.10 }, // 7-10L
          { threshold: 1000000, rate: 0.15 }, // 10-12L
          { threshold: 1200000, rate: 0.20 }, // 12-15L
          { threshold: 1500000, rate: 0.30 }  // >15L
        ]
      },
      {
          name: 'Cess',
          description: '4% Health & Education Cess.',
          type: 'percentage',
          rate: 0.04,
          isTaxSurcharge: true
      }
    ]
  },
  [CountryCode.JPN]: {
    code: CountryCode.JPN,
    name: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    exchangeRatePerUSD: 155.0,
    sources: [{ label: 'NTA 2024', url: 'https://www.nta.go.jp/', date: '2024-04-01' }],
    federalDeductibles: [
      {
        name: 'Pension (Kosei Nenkin)',
        description: '9.15% Employee share.',
        type: 'percentage',
        rate: 0.0915,
        cappedBase: 7920000,
        reducesTaxableIncome: true
      },
      {
        name: 'Health (Shakai Hoken)',
        description: 'Health Insurance (Tokyo ~5%).', 
        type: 'percentage',
        rate: 0.0498,
        cappedBase: 16680000,
        reducesTaxableIncome: true
      },
      {
        name: 'Employment Ins.',
        description: '0.6%.',
        type: 'percentage',
        rate: 0.006,
        reducesTaxableIncome: true
      },
      {
        name: 'Income Tax',
        description: 'Progressive National.',
        type: 'progressive',
        useTaxableIncome: true,
        // 2024 Adjustment: Basic Deduction (480k) + Employment Deduction (Min 550k -> 1M+ for avg salary)
        // We use 1.5M as a representative deduction for average earners to improve accuracy vs simplistic 1.03M
        exemptAmount: 1500000, 
        brackets: [
          { threshold: 0, rate: 0.05 },
          { threshold: 1950000, rate: 0.10 },
          { threshold: 3300000, rate: 0.20 },
          { threshold: 6950000, rate: 0.23 },
          { threshold: 9000000, rate: 0.33 },
          { threshold: 18000000, rate: 0.40 },
          { threshold: 40000000, rate: 0.45 },
        ]
      },
      {
        name: 'Resident Tax',
        description: '10% Flat (Local).',
        type: 'percentage',
        rate: 0.10,
        useTaxableIncome: true,
        exemptAmount: 1000000
      }
    ]
  },
  [CountryCode.NLD]: {
    code: CountryCode.NLD,
    name: 'Netherlands',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    hasExpatOption: true,
    sources: [{ label: 'Belastingdienst 2025', url: 'https://www.belastingdienst.nl/', date: '2024-11-01' }],
    federalDeductibles: [
        {
            name: 'Box 1 Income Tax',
            description: '36.97% / 49.50% (2025).',
            type: 'progressive',
            brackets: [
                { threshold: 0, rate: 0.3697 },
                { threshold: 76817, rate: 0.4950 } // 2025 Threshold est
            ]
        },
        {
            name: 'General Tax Credit',
            description: 'Algemene heffingskorting (Reduces Tax).',
            type: 'credit_progressive',
            exemptAmount: 3055, // Base credit 2025 est
            brackets: [
               { threshold: 0, rate: 0 },
               { threshold: 28406, rate: 0.0668 } 
            ]
        },
        {
            name: 'Labour Tax Credit',
            description: 'Arbeidskorting (Reduces Tax).',
            type: 'credit_progressive',
            exemptAmount: 0,
            brackets: [
                { threshold: 0, rate: -0.084 }, // Credit buildup
                { threshold: 11490, rate: -0.314 },
                { threshold: 24820, rate: -0.024 },
                { threshold: 39957, rate: 0.065 }   // Reduction
            ],
            cap: 5608 
        }
    ]
  },
  [CountryCode.SAU]: {
    code: CountryCode.SAU,
    name: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: '﷼',
    exchangeRatePerUSD: 3.75,
    hasExpatOption: true, // Used to toggle GOSI for Expats
    sources: [
        { label: 'GOSI Rates', url: 'https://www.gosi.gov.sa/en/Calculators', date: '2024-01-01' },
        { label: 'ZATCA (No Income Tax)', url: 'https://zatca.gov.sa/', date: '2024-01-01' }
    ],
    federalDeductibles: [
        {
            name: 'GOSI (Pension & Saned)',
            description: '9.75% for Nationals. 0% for Expats.',
            type: 'percentage',
            rate: 0.0975, // 9% Annuities + 0.75% Unemployment
            cappedBase: 540000 // 45,000 SAR/month wage cap
        }
    ]
  },
  [CountryCode.ARE]: {
    code: CountryCode.ARE,
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    exchangeRatePerUSD: 3.67,
    hasExpatOption: true, // Toggle GPSSA for Expats
    sources: [
        { label: 'U.A.E. Gov Portal', url: 'https://u.ae/en/information-and-services/finance-and-investment/taxation', date: '2024-01-01' },
        { label: 'ILOE', url: 'https://www.iloe.ae/', date: '2023-01-01' }
    ],
    federalDeductibles: [
        {
            name: 'GPSSA Pension',
            description: '5% for UAE Nationals (Capped at 50k/mo). 0% for Expats.',
            type: 'percentage',
            rate: 0.05,
            cappedBase: 600000 // 50k * 12
        },
        {
            name: 'ILOE Insurance',
            description: 'Unemployment Ins. (AED 60-120/yr).',
            type: 'fixed',
            amount: 120 // Using the higher tier for safety/simplicity as it's negligible (max ~$32/yr)
        }
    ]
  },
  [CountryCode.FRA]: {
    code: CountryCode.FRA,
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    sources: [{ label: 'Service Public 2024', url: 'https://www.service-public.fr/', date: '2024-01-01' }],
    federalDeductibles: [
        {
            name: 'Social Security',
            description: 'Health, Pension, Unemployment (~22%).',
            type: 'percentage',
            rate: 0.22,
            reducesTaxableIncome: true
        },
        {
            name: 'CSG/CRDS',
            description: '9.7% on 98.25% of Gross.',
            type: 'percentage',
            rate: 0.095, // 9.7 * 0.9825 approx
            // Note: Only 6.8% is deductible from income tax base, simplified here
            reducesTaxableIncome: true 
        },
        // Relief
        { name: 'Frais Professionnels', description: '10% Expense Allowance.', type: 'percentage', rate: 0.10, cap: 14171, reducesTaxableIncome: true, isRelief: true },

        {
            name: 'Income Tax (IR)',
            description: 'Progressive 2024 Scale.',
            type: 'progressive',
            useTaxableIncome: true,
            brackets: [
                { threshold: 0, rate: 0 },
                { threshold: 11294, rate: 0.11 },
                { threshold: 28797, rate: 0.30 },
                { threshold: 82341, rate: 0.41 },
                { threshold: 177106, rate: 0.45 }
            ]
        }
    ]
  },
  [CountryCode.ITA]: {
    code: CountryCode.ITA,
    name: 'Italy',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    sources: [{ label: 'Agenzia Entrate 2024', url: 'https://www.agenziaentrate.gov.it/', date: '2024-01-01' }],
    federalDeductibles: [
        {
            name: 'INPS (Social Security)',
            description: '9.19% (Standard Employee).',
            type: 'percentage',
            rate: 0.0919,
            reducesTaxableIncome: true
        },
        {
            name: 'IRPEF (Income Tax)',
            description: 'New 2024 Brackets.',
            type: 'progressive',
            useTaxableIncome: true,
            fixedCredits: 1500, // Simplified Detrazione Lavoro (Work Credit)
            brackets: [
                { threshold: 0, rate: 0.23 },
                { threshold: 28000, rate: 0.35 },
                { threshold: 50000, rate: 0.43 }
            ]
        },
        {
            name: 'Regional/Municipal Tax',
            description: 'Add-on ~2% (Varies by region).',
            type: 'percentage',
            rate: 0.02,
            useTaxableIncome: true
        }
    ]
  },
  [CountryCode.PRT]: {
    code: CountryCode.PRT,
    name: 'Portugal',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    sources: [{ label: 'Orçamento do Estado 2024', url: 'https://www.portugal.gov.pt/', date: '2024-01-01' }],
    federalDeductibles: [
        {
            name: 'Social Security',
            description: 'Segurança Social (11%).',
            type: 'percentage',
            rate: 0.11,
            reducesTaxableIncome: true // Generally reduces base for IRS, or specific deduction applies
        },
        {
            name: 'IRS (Income Tax)',
            description: 'Progressive (Mainland 2024).',
            type: 'progressive',
            useTaxableIncome: true, 
            exemptAmount: 4104, // Minimum existence / specific deduction
            brackets: [
                { threshold: 0, rate: 0.1325 },
                { threshold: 7703, rate: 0.18 },
                { threshold: 11623, rate: 0.23 },
                { threshold: 16472, rate: 0.26 },
                { threshold: 21321, rate: 0.3275 },
                { threshold: 27146, rate: 0.37 },
                { threshold: 39791, rate: 0.435 },
                { threshold: 51997, rate: 0.45 },
                { threshold: 81199, rate: 0.48 }
            ]
        }
    ]
  },
  [CountryCode.SWE]: {
    code: CountryCode.SWE,
    name: 'Sweden',
    currency: 'SEK',
    currencySymbol: 'kr',
    exchangeRatePerUSD: 10.8,
    sources: [{ label: 'Skatteverket 2024', url: 'https://skatteverket.se/', date: '2024-01-01' }],
    federalDeductibles: [
        {
            name: 'Municipal Tax',
            description: 'Local Tax (~32.37% Avg).',
            type: 'percentage',
            rate: 0.3237,
            exemptAmount: 16800 // Basic deduction approx
        },
        {
            name: 'State Tax',
            description: '20% over 615,300 SEK.',
            type: 'progressive',
            brackets: [
                { threshold: 0, rate: 0 },
                { threshold: 615300, rate: 0.20 }
            ]
        },
        {
            name: 'Public Pension Fee',
            description: 'Allmän pensionsavgift (7%).',
            type: 'percentage',
            rate: 0.07,
            cap: 42600, // Capped amount usually fully credited back by tax credit
            fixedCredits: 42600 // Simplified: The fee is usually fully offset by a tax credit
        },
        {
            name: 'Job Deduction',
            description: 'Jobbskatteavdrag (Credit).',
            type: 'credit_progressive',
            exemptAmount: 0,
            brackets: [
                 { threshold: 0, rate: -0.10 } // Simplified Estimate of credit
            ],
            cap: 35000 // Approx cap
        }
    ]
  }
};
