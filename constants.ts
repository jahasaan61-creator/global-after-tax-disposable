import { CountryCode, CountryRules } from './types';

// Updated for 2024/2025 Tax Years where available.

export const COUNTRY_RULES: Record<CountryCode, CountryRules> = {
  [CountryCode.USA]: {
    code: CountryCode.USA,
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    subNationalLabel: 'State',
    hasMaritalStatusOption: true,
    sources: [
      { label: 'IRS 2024 Brackets & Standard Deduction', url: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024', date: '2024-01-01' },
      { label: 'Social Security Wage Base 2024', url: 'https://www.ssa.gov/news/press/factsheets/colafacts2024.pdf', date: '2024-01-01' }
    ],
    federalDeductibles: [
      {
        name: 'Federal Income Tax',
        description: 'Progressive tax. Calc adjusts for Filing Status (Single vs Married).',
        type: 'progressive',
        // Single 2024
        exemptAmount: 14600, 
        brackets: [
          { threshold: 0, rate: 0.10 },
          { threshold: 11600, rate: 0.12 },
          { threshold: 47150, rate: 0.22 },
          { threshold: 100525, rate: 0.24 },
          { threshold: 191950, rate: 0.32 },
          { threshold: 243725, rate: 0.35 },
          { threshold: 609350, rate: 0.37 },
        ]
        // Note: Service handles swapping these for Married brackets
      },
      {
        name: 'Social Security',
        description: 'Mandatory contribution for retirement (OASDI).',
        type: 'percentage',
        rate: 0.062,
        cappedBase: 168600 // 2024 Wage Base Limit
      },
      {
        name: 'Medicare',
        description: 'Federal health insurance program.',
        type: 'percentage',
        rate: 0.0145
      }
    ],
    subNationalRules: [
      {
        id: 'CA',
        name: 'California',
        deductibles: [
          {
            name: 'CA State Tax',
            description: 'State income tax.',
            type: 'progressive',
            exemptAmount: 5363, 
            brackets: [
              { threshold: 0, rate: 0.01 },
              { threshold: 10412, rate: 0.02 },
              { threshold: 24684, rate: 0.04 },
              { threshold: 38959, rate: 0.06 },
              { threshold: 54081, rate: 0.08 },
              { threshold: 68350, rate: 0.093 },
              { threshold: 349137, rate: 0.103 },
            ]
          },
          { name: 'CA SDI', description: 'State Disability Insurance.', type: 'percentage', rate: 0.011, cappedBase: 153164 } 
        ]
      },
      {
        id: 'TX',
        name: 'Texas',
        deductibles: [] 
      },
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
            ]
           }
        ]
      }
    ]
  },
  [CountryCode.CHE]: {
    code: CountryCode.CHE,
    name: 'Switzerland',
    currency: 'CHF',
    currencySymbol: 'CHF',
    subNationalLabel: 'Canton',
    sources: [{ label: 'ESTV Tax Calc', url: 'https://swisstaxcalculator.estv.admin.ch/', date: '2024-01-01' }],
    federalDeductibles: [
      { name: 'Federal Tax (Direct)', description: 'Direct Federal Tax (Bundessteuer).', type: 'progressive', brackets: [{ threshold: 18300, rate: 0.0077 }, { threshold: 31600, rate: 0.0088 }, { threshold: 41400, rate: 0.0264 }, { threshold: 55200, rate: 0.0297 }, { threshold: 72500, rate: 0.0594 }] },
      { name: 'AHV/IV/EO (OASI)', description: 'Old-Age and Survivors Insurance.', type: 'percentage', rate: 0.053 },
      { name: 'ALV (Unemployment)', description: 'Unemployment Insurance.', type: 'percentage', rate: 0.011, cappedBase: 148200 },
      { name: 'Pension (BVG) - Est.', description: 'Occupational Pension (2nd Pillar) approx.', type: 'percentage', rate: 0.035, exemptAmount: 25725 } 
    ],
    subNationalRules: [
      {
        id: 'ZH',
        name: 'Zurich',
        deductibles: [{ name: 'Cantonal/Communal Tax (Est.)', type: 'percentage', rate: 0.10 }] 
      },
      {
        id: 'GE',
        name: 'Geneva',
        deductibles: [{ name: 'Cantonal/Communal Tax (Est.)', type: 'percentage', rate: 0.15 }] 
      }
    ]
  },
  [CountryCode.SGP]: {
    code: CountryCode.SGP,
    name: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    sources: [{ label: 'CPF Rates 2024', url: 'https://www.cpf.gov.sg/employer/employer-obligations/creating-a-progressive-workplace/cpf-contribution-rates', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax',
        description: 'Personal Income Tax rates.',
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
        ]
      },
      {
        name: 'CPF Contribution',
        description: 'Mandatory savings. Rates vary significantly by age.',
        type: 'percentage',
        rate: 0.20, // Default (<= 55)
        ratesByAge: [
            { minAge: 0, maxAge: 55, rate: 0.20 },
            { minAge: 55, maxAge: 60, rate: 0.17 },
            { minAge: 60, maxAge: 65, rate: 0.115 },
            { minAge: 65, maxAge: 70, rate: 0.075 },
            { minAge: 70, maxAge: 100, rate: 0.05 },
        ],
        cappedBase: 81600 // $6800 monthly wage ceiling (2024) * 12. 
      }
    ]
  },
  [CountryCode.DEU]: {
    code: CountryCode.DEU,
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    hasMaritalStatusOption: true, // Enables Income Splitting
    hasChurchTaxOption: true,
    sources: [{ label: 'BMF 2024', url: 'https://www.bmf-steuerrechner.de/', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax (Einkommensteuer)',
        description: 'Progressive tax. Supports Married Splitting.',
        type: 'progressive',
        exemptAmount: 11604, // Grundfreibetrag 2024
        brackets: [
          { threshold: 0, rate: 0.14 },
          { threshold: 17005, rate: 0.24 }, 
          { threshold: 66760, rate: 0.42 },
          { threshold: 277825, rate: 0.45 },
        ]
      },
      { name: 'Church Tax', description: 'Kirchensteuer (approx 9% of Income Tax).', type: 'percentage', rate: 0.09, isChurchTax: true },
      { name: 'Pension Insurance', description: 'Rentenversicherung.', type: 'percentage', rate: 0.093, cappedBase: 90600 }, 
      { name: 'Unemployment Insurance', description: 'Arbeitslosenversicherung.', type: 'percentage', rate: 0.013, cappedBase: 90600 },
      { name: 'Health Insurance (Employee)', description: 'Krankenversicherung.', type: 'percentage', rate: 0.081, cappedBase: 62100 }, 
      { name: 'Nursing Care Insurance', description: 'Pflegeversicherung.', type: 'percentage', rate: 0.023, cappedBase: 62100 },
    ]
  },
  [CountryCode.IRL]: {
    code: CountryCode.IRL,
    name: 'Ireland',
    currency: 'EUR',
    currencySymbol: '€',
    hasMaritalStatusOption: true, // Affects Rate Band
    sources: [{ label: 'Revenue.ie Budget 2024', url: 'https://www.revenue.ie/', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'PAYE (Income Tax)',
        description: 'Income Tax. Married couples get wider bands.',
        type: 'progressive',
        fixedCredits: 3750, 
        brackets: [
          { threshold: 0, rate: 0.20 },
          { threshold: 42000, rate: 0.40 },
        ]
      },
      {
        name: 'USC',
        description: 'Universal Social Charge.',
        type: 'progressive',
        brackets: [
           { threshold: 0, rate: 0.005 },
           { threshold: 12012, rate: 0.02 },
           { threshold: 25760, rate: 0.04 },
           { threshold: 70044, rate: 0.08 },
        ]
      },
      { name: 'PRSI (Class A)', description: 'Pay Related Social Insurance.', type: 'percentage', rate: 0.04 }
    ]
  },
  [CountryCode.NZL]: {
    code: CountryCode.NZL,
    name: 'New Zealand',
    currency: 'NZD',
    currencySymbol: '$',
    sources: [{ label: 'IRD 2024/25', url: 'https://www.ird.govt.nz/', date: '2024-04-01' }],
    federalDeductibles: [
      {
        name: 'PAYE Tax',
        description: 'Pay As You Earn income tax.',
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0.105 },
          { threshold: 14000, rate: 0.175 },
          { threshold: 48000, rate: 0.30 },
          { threshold: 70000, rate: 0.33 },
          { threshold: 180000, rate: 0.39 },
        ]
      },
      { name: 'ACC Earner Levy', description: 'Accident Compensation Corporation levy.', type: 'percentage', rate: 0.016, cappedBase: 139384 } 
    ]
  },
  [CountryCode.CAN]: {
    code: CountryCode.CAN,
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: '$',
    subNationalLabel: 'Province',
    sources: [{ label: 'CRA 2024 Rates', url: 'https://www.canada.ca/', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'Federal Tax',
        description: 'Federal income tax.',
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
      { name: 'CPP', description: 'Canada Pension Plan.', type: 'percentage', rate: 0.0595, exemptAmount: 3500, cappedBase: 68500 }, 
      { name: 'EI', description: 'Employment Insurance.', type: 'percentage', rate: 0.0166, cappedBase: 63200 }
    ],
    subNationalRules: [
      {
        id: 'ON', name: 'Ontario', deductibles: [
           { name: 'ON Tax', description: 'Ontario Provincial Tax.', type: 'progressive', exemptAmount: 12399, brackets: [{ threshold: 0, rate: 0.0505 }, { threshold: 51446, rate: 0.0915 }, { threshold: 102894, rate: 0.1116 }] }
        ]
      },
      {
        id: 'BC', name: 'British Columbia', deductibles: [
           { name: 'BC Tax', description: 'BC Provincial Tax.', type: 'progressive', exemptAmount: 12580, brackets: [{ threshold: 0, rate: 0.0506 }, { threshold: 47937, rate: 0.077 }] }
        ]
      }
    ]
  },
  [CountryCode.NOR]: {
    code: CountryCode.NOR,
    name: 'Norway',
    currency: 'NOK',
    currencySymbol: 'kr',
    sources: [{ label: 'Skatteetaten 2024', url: 'https://www.skatteetaten.no/', date: '2024-01-01' }],
    federalDeductibles: [
      { 
        name: 'Income Tax (Alminnelig inntekt)', 
        description: 'General income tax on net income.',
        type: 'percentage', 
        rate: 0.22,
        exemptAmount: 88250 
      },
      {
        name: 'Bracket Tax (Trinnskatt)',
        description: 'Progressive tax on gross personal income.',
        type: 'progressive',
        brackets: [
          { threshold: 208050, rate: 0.017 },
          { threshold: 292850, rate: 0.04 },
          { threshold: 670000, rate: 0.136 },
          { threshold: 937900, rate: 0.166 },
          { threshold: 1350000, rate: 0.176 },
        ]
      },
      { name: 'National Insurance (Trygdeavgift)', description: 'Contribution to the NI Scheme.', type: 'percentage', rate: 0.078 }
    ]
  }
};