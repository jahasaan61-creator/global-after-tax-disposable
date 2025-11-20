
import { CountryCode, CountryRules } from './types';

// Updated for 2024/2025 Tax Years.

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
      { label: 'IRS 2025 Brackets & Deductions (Projected)', url: 'https://www.irs.gov/', date: '2024-11-01' },
      { label: 'SSA Fact Sheet 2025', url: 'https://www.ssa.gov/news/press/factsheets/', date: '2024-11-01' }
    ],
    federalDeductibles: [
      {
        name: 'Federal Income Tax',
        description: 'Progressive tax. 2025 Brackets.',
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
        name: 'Social Security',
        description: 'OASDI. 6.2% on earnings up to wage base.',
        type: 'percentage',
        rate: 0.062,
        cappedBase: 176100 // 2025 Wage Base
      },
      {
        name: 'Medicare',
        description: '1.45% flat. Includes +0.9% Additional Tax over threshold.',
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0.0145 },
          { threshold: 200000, rate: 0.0235 } // +0.9% Additional Medicare Tax
        ],
        bracketsMarried: [
          { threshold: 0, rate: 0.0145 },
          { threshold: 250000, rate: 0.0235 } // Higher threshold for Married Joint
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
          { name: 'CA SDI', description: 'State Disability Insurance (2025 Est).', type: 'percentage', rate: 0.012 } 
        ]
      },
      { id: 'TX', name: 'Texas', deductibles: [] },
      {
        id: 'NY',
        name: 'New York',
        deductibles: [
           {
            name: 'NY State Tax',
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
           },
           {
            name: 'NY PFL',
            description: 'Paid Family Leave (0.373% capped).',
            type: 'percentage',
            rate: 0.00373,
            cappedBase: 89344
           }
        ]
      },
      {
        id: 'WA',
        name: 'Washington',
        deductibles: [
          { name: 'WA Cares Fund', description: 'Long-term care tax.', type: 'percentage', rate: 0.0058 }
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
    sources: [{ label: 'CPF Rates & Ceilings 2025', url: 'https://www.cpf.gov.sg/', date: '2024-11-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax',
        description: 'Personal Income Tax (YA 2024).',
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
        description: 'Mandatory savings (Employee Share). Ceiling $7,400 (2025).',
        type: 'percentage',
        rate: 0.20, 
        ratesByAge: [
            { minAge: 0, maxAge: 55, rate: 0.20 },
            { minAge: 55, maxAge: 60, rate: 0.17 },
            { minAge: 60, maxAge: 65, rate: 0.115 },
            { minAge: 65, maxAge: 70, rate: 0.075 },
            { minAge: 70, maxAge: 100, rate: 0.05 },
        ],
        cappedBase: 88800 // $7,400 monthly ceiling from Jan 2025
      },
      {
        name: 'SHG (Self-Help Group)',
        description: 'CDAC/SINDA/MBMF (Estimated Average).',
        type: 'fixed',
        amount: 36 // $3.00/mo * 12
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
    sources: [{ label: 'BMF 2025 Proposed', url: 'https://www.bundesfinanzministerium.de/', date: '2024-11-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax (Einkommensteuer)',
        description: 'Progressive. Married Splitting supported.',
        type: 'progressive',
        exemptAmount: 12084, // 2025 Basic Allowance (Grundfreibetrag)
        brackets: [
          { threshold: 0, rate: 0.14 },
          { threshold: 17761, rate: 0.24 }, // Adjusted zone
          { threshold: 68401, rate: 0.42 }, // 2025 Top tax rate threshold
          { threshold: 277825, rate: 0.45 }, // Reichensteuer
        ]
      },
      { 
          name: 'Solidarity Surcharge', 
          description: '5.5% on tax if Income Tax > €18k.', 
          type: 'percentage', 
          rate: 0.055, 
          isTaxSurcharge: true,
          surchargeThreshold: 18130 // Freigrenze 2024/25 (Solo)
      },
      { 
          name: 'Church Tax', 
          description: 'Kirchensteuer (8-9% of Tax).', 
          type: 'percentage', 
          rate: 0.09, 
          isTaxSurcharge: true 
      },
      { name: 'Pension Insurance', description: 'Rentenversicherung (9.3%).', type: 'percentage', rate: 0.093, cappedBase: 96600 }, // 2025 est BBG
      { name: 'Unemployment Insurance', description: 'Arbeitslosenversicherung (1.3%).', type: 'percentage', rate: 0.013, cappedBase: 96600 },
      { name: 'Health Insurance', description: 'KV 7.3% + 1.25% (2025 Avg Add-on).', type: 'percentage', rate: 0.0855, cappedBase: 66150 }, // 2025 est BBG
      { name: 'Nursing Care', description: 'PV (2.3% approx).', type: 'percentage', rate: 0.023, cappedBase: 66150 },
    ]
  },
  [CountryCode.IRL]: {
    code: CountryCode.IRL,
    name: 'Ireland',
    currency: 'EUR',
    currencySymbol: '€',
    exchangeRatePerUSD: 0.93,
    hasMaritalStatusOption: true, 
    sources: [{ label: 'Budget 2025', url: 'https://www.revenue.ie/', date: '2024-10-01' }],
    federalDeductibles: [
      {
        name: 'PAYE (Income Tax)',
        description: '20% / 40%. Band €44,000 (Single).',
        type: 'progressive',
        fixedCredits: 4000, // €2000 Personal + €2000 Employee (Budget 2025)
        fixedCreditsMarried: 6000, // €4000 Married Personal + €2000 Employee
        brackets: [
          { threshold: 0, rate: 0.20 },
          { threshold: 44000, rate: 0.40 },
        ],
        bracketsMarried: [
          { threshold: 0, rate: 0.20 },
          { threshold: 53000, rate: 0.40 }, // Married One Earner Band
          // Note: Two earners can go up to 88k, handled via inputs ideally, but simplistic assumptions here
        ]
      },
      {
        name: 'USC',
        description: 'Universal Social Charge (Budget 2025).',
        type: 'progressive',
        brackets: [
           { threshold: 0, rate: 0.005 },
           { threshold: 12012, rate: 0.02 },
           { threshold: 27382, rate: 0.03 }, // Reduced to 3% in Budget 2025
           { threshold: 70044, rate: 0.08 },
        ]
      },
      { name: 'PRSI (Class A)', description: 'Social Insurance.', type: 'percentage', rate: 0.04 }
    ]
  },
  [CountryCode.CAN]: {
    code: CountryCode.CAN,
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: '$',
    exchangeRatePerUSD: 1.38,
    subNationalLabel: 'Province',
    sources: [{ label: 'CRA 2025 Limits', url: 'https://www.canada.ca/', date: '2024-11-15' }],
    federalDeductibles: [
      {
        name: 'Federal Tax',
        description: 'Federal income tax (2024).',
        type: 'progressive',
        exemptAmount: 15705, 
        brackets: [
          { threshold: 0, rate: 0.15 },
          { threshold: 55867, rate: 0.205 },
          { threshold: 111733, rate: 0.26 },
          { threshold: 173205, rate: 0.29 },
          { threshold: 246752, rate: 0.33 },
        ]
      },
      { 
          name: 'CPP (Base)', 
          description: 'Pension Plan (Tier 1).', 
          type: 'percentage', 
          rate: 0.0595, 
          exemptAmount: 3500, 
          cappedBase: 71300 // 2025 YMPE
      },
      {
          name: 'CPP (Enhancement)',
          description: 'Tier 2 (4% on 71.3k - 81.1k).',
          type: 'progressive',
          brackets: [
              { threshold: 0, rate: 0 },
              { threshold: 71300, rate: 0.04 }
          ],
          cappedBase: 81100 // 2025 Tier 2 Ceiling
      },
      { name: 'EI', description: 'Employment Insurance.', type: 'percentage', rate: 0.0164, cappedBase: 65700 } // 2025 Projected
    ],
    subNationalRules: [
      {
        id: 'ON', name: 'Ontario', deductibles: [
           { name: 'ON Tax', description: 'Ontario Tax.', type: 'progressive', exemptAmount: 12399, brackets: [{ threshold: 0, rate: 0.0505 }, { threshold: 51446, rate: 0.0915 }, { threshold: 102894, rate: 0.1116 }, { threshold: 150000, rate: 0.1216 }, { threshold: 220000, rate: 0.1316 }] },
           { name: 'ON Health Premium', description: 'Mandatory Health Premium.', type: 'progressive', brackets: [
               { threshold: 0, rate: 0 },
               { threshold: 20000, rate: 0.06 }, 
               { threshold: 36000, rate: 0.06 }, // Simplified approximation of the tiered fixed amounts
               { threshold: 48000, rate: 0.25 },
               { threshold: 72000, rate: 0.25 },
               { threshold: 200000, rate: 0.25 },
           ], cap: 900 }
        ]
      },
      {
        id: 'BC', name: 'British Columbia', deductibles: [
           { name: 'BC Tax', description: 'BC Tax.', type: 'progressive', exemptAmount: 12580, brackets: [{ threshold: 0, rate: 0.0506 }, { threshold: 47937, rate: 0.077 }, { threshold: 95875, rate: 0.105 }, { threshold: 110076, rate: 0.1229 }, { threshold: 133664, rate: 0.147 }, { threshold: 181232, rate: 0.168 }] }
        ]
      }
    ]
  },
  [CountryCode.NZL]: {
    code: CountryCode.NZL,
    name: 'New Zealand',
    currency: 'NZD',
    currencySymbol: '$',
    exchangeRatePerUSD: 1.68,
    sources: [{ label: 'IRD 2024/25', url: 'https://www.ird.govt.nz/', date: '2024-04-01' }],
    federalDeductibles: [
      {
        name: 'PAYE Tax',
        description: 'Pay As You Earn.',
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0.105 },
          { threshold: 14000, rate: 0.175 },
          { threshold: 48000, rate: 0.30 },
          { threshold: 70000, rate: 0.33 },
          { threshold: 180000, rate: 0.39 },
        ]
      },
      { name: 'ACC Earner Levy', description: 'Accident Cover (1.6%).', type: 'percentage', rate: 0.016, cappedBase: 142283 },
      { name: 'KiwiSaver', description: 'Retirement Savings (Default 3%).', type: 'percentage', rate: 0.03 }
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
      { name: 'Federal Tax (Direct)', description: 'Direct Federal Tax.', type: 'progressive', brackets: [{ threshold: 18300, rate: 0.0077 }, { threshold: 31600, rate: 0.0088 }, { threshold: 41400, rate: 0.0264 }, { threshold: 55200, rate: 0.0297 }, { threshold: 72500, rate: 0.0594 }] },
      { name: 'AHV/IV/EO (OASI)', description: 'Old-Age/Survivors (5.3%).', type: 'percentage', rate: 0.053 },
      { name: 'ALV (Unemployment)', description: 'Unemployment (1.1%).', type: 'percentage', rate: 0.011, cappedBase: 148200 },
      { name: 'NBU', description: 'Non-occupational Accident Ins.', type: 'percentage', rate: 0.012 },
      { name: 'KTG (Sick Pay Ins.)', description: 'Daily Sickness Allowance (Est).', type: 'percentage', rate: 0.005 },
      { name: 'Pension (BVG) - Est.', description: 'Occupational Pension.', type: 'percentage', rate: 0.035, exemptAmount: 25725 } 
    ],
    subNationalRules: [
      { id: 'ZH', name: 'Zurich', deductibles: [{ name: 'Cantonal/Communal Tax (Est.)', type: 'percentage', rate: 0.10 }] },
      { id: 'GE', name: 'Geneva', deductibles: [{ name: 'Cantonal/Communal Tax (Est.)', type: 'percentage', rate: 0.15 }] }
    ]
  },
  [CountryCode.NOR]: {
    code: CountryCode.NOR,
    name: 'Norway',
    currency: 'NOK',
    currencySymbol: 'kr',
    exchangeRatePerUSD: 11.0,
    sources: [{ label: 'Skatteetaten 2024', url: 'https://www.skatteetaten.no/', date: '2024-01-01' }],
    federalDeductibles: [
      { 
        name: 'Income Tax (Net)', 
        description: 'General income tax (22%).',
        type: 'percentage', 
        rate: 0.22,
        exemptAmount: 108550 // Personfradrag 2025 Budget
      },
      {
        name: 'Bracket Tax (Gross)',
        description: 'Trinnskatt (Progressive).',
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
    sources: [{ label: 'Finance Act 2024 (NBR)', url: 'https://nbr.gov.bd/', date: '2024-07-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax',
        description: 'Progressive Tax (General Category).',
        type: 'progressive',
        exemptAmount: 350000, // First 3.5 Lakh Nil
        brackets: [
          { threshold: 0, rate: 0.05 },       // Next 100,000
          { threshold: 100000, rate: 0.10 },  // Next 400,000
          { threshold: 500000, rate: 0.15 },  // Next 500,000
          { threshold: 1000000, rate: 0.20 }, // Next 500,000
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
        { label: 'Agencia Tributaria 2024', url: 'https://sede.agenciatributaria.gob.es/', date: '2024-01-01' },
        { label: 'Seguridad Social Rates', url: 'https://www.seg-social.es/', date: '2024-01-01' }
    ],
    federalDeductibles: [
      {
        name: 'Social Security',
        description: 'Contingencias Comunes (4.7%).',
        type: 'percentage',
        rate: 0.047,
        cappedBase: 56646 // 2024 Max Base ~4720.50/mo
      },
      {
        name: 'Unemployment / Training / MEI',
        description: 'Desempleo (1.55%), FP (0.1%), MEI (0.13% 2025).',
        type: 'percentage',
        rate: 0.0178,
        cappedBase: 56646
      },
      {
        name: 'IRPF (Income Tax)',
        description: 'Progressive (State + Autonomic avg).',
        type: 'progressive',
        // Spain subtracts tax on allowance from total tax, rather than exempting income from base.
        // Tax on 5550 (1st bracket 19%) = 1054.50
        fixedCredits: 1054.50, 
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
  [CountryCode.GBR]: {
    code: CountryCode.GBR,
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    exchangeRatePerUSD: 0.79,
    sources: [{ label: 'GOV.UK Rates 2024/25', url: 'https://www.gov.uk/income-tax-rates', date: '2024-04-06' }],
    federalDeductibles: [
        {
            name: 'Income Tax',
            description: 'Progressive. Personal Allowance £12,570.',
            type: 'progressive',
            exemptAmount: 12570,
            brackets: [
                { threshold: 0, rate: 0.20 },     // Basic rate
                { threshold: 37700, rate: 0.40 }, // Higher rate (starts at £50,270 total income)
                { threshold: 112570, rate: 0.45 } // Additional rate (starts at £125,140 total)
            ]
        },
        {
            name: 'National Insurance',
            description: 'Class 1 Employee Contributions.',
            type: 'progressive',
            exemptAmount: 12570, // Primary Threshold
            brackets: [
                { threshold: 0, rate: 0.08 },     // 8% on earnings between £12,570 and £50,270
                { threshold: 37700, rate: 0.02 }  // 2% on earnings above £50,270
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
        { label: 'Income Tax Dept (FY 24-25)', url: 'https://incometaxindia.gov.in/', date: '2024-07-23' },
        { label: 'EPFO Rates', url: 'https://www.epfindia.gov.in/', date: '2024-04-01' }
    ],
    federalDeductibles: [
      {
        name: 'EPF (Provident Fund)',
        description: 'Employee Contribution (12% of Basic, capped at ₹15k/mo).',
        type: 'percentage',
        rate: 0.12,
        cappedBase: 180000 // 15,000 * 12
      },
      {
        name: 'Income Tax (New Regime)',
        description: 'Progressive Slabs (FY 2024-25). Std Ded ₹75k.',
        type: 'progressive',
        exemptAmount: 75000, // Increased Standard Deduction
        brackets: [
          { threshold: 0, rate: 0 },
          { threshold: 300000, rate: 0.05 },
          { threshold: 700000, rate: 0.10 },
          { threshold: 1000000, rate: 0.15 },
          { threshold: 1200000, rate: 0.20 },
          { threshold: 1500000, rate: 0.30 }
        ]
      },
      {
          name: 'Health & Education Cess',
          description: '4% on Income Tax.',
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
    sources: [
        { label: 'NTA Income Tax 2024', url: 'https://www.nta.go.jp/english/', date: '2024-04-01' },
        { label: 'MHLW Social Insurance 2024', url: 'https://www.mhlw.go.jp/english/', date: '2024-04-01' }
    ],
    federalDeductibles: [
      {
        name: 'Social: Pension (Kosei Nenkin)',
        description: 'Employee Pension (9.15%).',
        type: 'percentage',
        rate: 0.0915,
        cappedBase: 8160000 // 680,000 * 12 (Standard Monthly Remuneration Cap)
      },
      {
        name: 'Social: Health (Shakai Hoken)',
        description: 'Health Insurance (Tokyo ~5%).', // Approx 9.98% split
        type: 'percentage',
        rate: 0.0499,
        cappedBase: 16680000 // 1,390,000 * 12
      },
      {
        name: 'Social: Nursing Care (Kaigo)',
        description: 'Age 40-64 only (0.9%).',
        type: 'percentage',
        rate: 0, // Default 0
        ratesByAge: [{ minAge: 39, maxAge: 64, rate: 0.009 }],
        cappedBase: 16680000
      },
      {
        name: 'Social: Employment Ins.',
        description: 'Koyou Hoken (0.6%).',
        type: 'percentage',
        rate: 0.006
      },
      {
        name: 'Income Tax',
        description: 'National Progressive Tax.',
        type: 'progressive',
        exemptAmount: 1030000, // Basic (480k) + Min Emp Ded (550k) approximation
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
        description: 'Municipal + Prefectural (10%).',
        type: 'percentage',
        rate: 0.10,
        exemptAmount: 1000000 // Basic (430k) + Min Emp (550k) approx
      }
    ]
  }
};