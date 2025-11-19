import { CountryCode, CountryRules } from './types';

// NOTE: In a real production app, this would be a fetch-able JSON file.
// Updated for 2024/2025 Tax Years where available.

export const COUNTRY_RULES: Record<CountryCode, CountryRules> = {
  [CountryCode.USA]: {
    code: CountryCode.USA,
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    subNationalLabel: 'State',
    sources: [
      { label: 'IRS 2024 Brackets & Standard Deduction', url: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024', date: '2024-01-01' },
      { label: 'Social Security Wage Base 2024', url: 'https://www.ssa.gov/news/press/factsheets/colafacts2024.pdf', date: '2024-01-01' }
    ],
    federalDeductibles: [
      {
        name: 'Federal Income Tax',
        type: 'progressive',
        // 2024 Standard Deduction for Single Filer: $14,600
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
      },
      {
        name: 'Social Security',
        type: 'percentage',
        rate: 0.062,
        cappedBase: 168600 // 2024 Wage Base Limit
      },
      {
        name: 'Medicare',
        type: 'percentage',
        rate: 0.0145
        // Note: Additional Medicare Tax of 0.9% applies to wages over $200,000. 
        // Simplified here, but accuracy enhanced by separate line if needed.
      }
    ],
    subNationalRules: [
      {
        id: 'CA',
        name: 'California',
        deductibles: [
          {
            name: 'CA State Tax',
            type: 'progressive',
            exemptAmount: 5363, // Approx Standard Deduction CA Single
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
          { name: 'CA SDI', type: 'percentage', rate: 0.011, cappedBase: 153164 } // 2024 Cap
        ]
      },
      {
        id: 'TX',
        name: 'Texas',
        deductibles: [] // No state income tax
      },
      {
        id: 'NY',
        name: 'New York',
        deductibles: [
           {
            name: 'NY State Tax',
            type: 'progressive',
            exemptAmount: 8000, // NY Standard Deduction
            brackets: [
              { threshold: 0, rate: 0.04 },
              { threshold: 8500, rate: 0.045 },
              { threshold: 11700, rate: 0.0525 },
              { threshold: 13900, rate: 0.0585 },
              { threshold: 80650, rate: 0.0625 }, // Simplified upper brackets
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
      { name: 'Federal Tax (Direct)', type: 'progressive', brackets: [{ threshold: 18300, rate: 0.0077 }, { threshold: 31600, rate: 0.0088 }, { threshold: 41400, rate: 0.0264 }, { threshold: 55200, rate: 0.0297 }, { threshold: 72500, rate: 0.0594 }] },
      { name: 'AHV/IV/EO (OASI)', type: 'percentage', rate: 0.053 },
      { name: 'ALV (Unemployment)', type: 'percentage', rate: 0.011, cappedBase: 148200 },
      { name: 'Pension (BVG) - Est.', type: 'percentage', rate: 0.035, exemptAmount: 25725 } // Deduction usually applies to coordinated salary
    ],
    subNationalRules: [
      {
        id: 'ZH',
        name: 'Zurich',
        deductibles: [{ name: 'Cantonal/Communal Tax', type: 'percentage', rate: 0.10 }] 
      },
      {
        id: 'GE',
        name: 'Geneva',
        deductibles: [{ name: 'Cantonal/Communal Tax', type: 'percentage', rate: 0.15 }] 
      }
    ]
  },
  [CountryCode.SGP]: {
    code: CountryCode.SGP,
    name: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    sources: [{ label: 'IRAS 2024 Rates', url: 'https://www.iras.gov.sg/', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax',
        type: 'progressive',
        // First 20k is tax free, effectively handled by bracket 0 -> rate 0 if we set threshold 20k as start of tax.
        // But to match data structure: 0-20k @ 0%.
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
        name: 'CPF (Citizen/PR <= 55)',
        type: 'percentage',
        rate: 0.20,
        cappedBase: 81600 // $6800 monthly wage ceiling (2024) * 12. Note: Raised to $8000/mo in 2025.
      }
    ]
  },
  [CountryCode.DEU]: {
    code: CountryCode.DEU,
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    sources: [{ label: 'BMF 2024', url: 'https://www.bmf-steuerrechner.de/', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'Income Tax (Einkommensteuer)',
        type: 'progressive',
        exemptAmount: 11604, // Grundfreibetrag 2024
        brackets: [
          { threshold: 0, rate: 0.14 },
          { threshold: 17005, rate: 0.24 }, // Simplified linear progression approximation
          { threshold: 66760, rate: 0.42 },
          { threshold: 277825, rate: 0.45 },
        ]
      },
      { name: 'Pension Insurance', type: 'percentage', rate: 0.093, cappedBase: 90600 }, // BBG West 2024
      { name: 'Unemployment Insurance', type: 'percentage', rate: 0.013, cappedBase: 90600 },
      { name: 'Health Insurance (Employee)', type: 'percentage', rate: 0.081, cappedBase: 62100 }, // BBG Health 2024
      { name: 'Nursing Care Insurance', type: 'percentage', rate: 0.023, cappedBase: 62100 },
    ]
  },
  [CountryCode.IRL]: {
    code: CountryCode.IRL,
    name: 'Ireland',
    currency: 'EUR',
    currencySymbol: '€',
    sources: [{ label: 'Revenue.ie Budget 2024', url: 'https://www.revenue.ie/', date: '2024-01-01' }],
    federalDeductibles: [
      {
        name: 'PAYE (Income Tax)',
        type: 'progressive',
        fixedCredits: 3750, // Personal Tax Credit (€1875) + Employee Tax Credit (€1875)
        brackets: [
          { threshold: 0, rate: 0.20 },
          { threshold: 42000, rate: 0.40 },
        ]
      },
      {
        name: 'USC',
        type: 'progressive',
        brackets: [
           { threshold: 0, rate: 0.005 },
           { threshold: 12012, rate: 0.02 },
           { threshold: 25760, rate: 0.04 },
           { threshold: 70044, rate: 0.08 },
        ]
      },
      { name: 'PRSI (Class A)', type: 'percentage', rate: 0.04 }
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
        type: 'progressive',
        brackets: [
          { threshold: 0, rate: 0.105 },
          { threshold: 14000, rate: 0.175 },
          { threshold: 48000, rate: 0.30 },
          { threshold: 70000, rate: 0.33 },
          { threshold: 180000, rate: 0.39 },
        ]
      },
      { name: 'ACC Earner Levy', type: 'percentage', rate: 0.016, cappedBase: 139384 } // 2024/25 Cap
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
        type: 'progressive',
        exemptAmount: 15705, // 2024 Basic Personal Amount
        brackets: [
          { threshold: 0, rate: 0.15 },
          { threshold: 55867, rate: 0.205 },
          { threshold: 111733, rate: 0.26 },
          { threshold: 173205, rate: 0.29 },
          { threshold: 246752, rate: 0.33 },
        ]
      },
      { name: 'CPP', type: 'percentage', rate: 0.0595, exemptAmount: 3500, cappedBase: 68500 }, // 2024 YMPE
      { name: 'EI', type: 'percentage', rate: 0.0166, cappedBase: 63200 }
    ],
    subNationalRules: [
      {
        id: 'ON', name: 'Ontario', deductibles: [
           { name: 'ON Tax', type: 'progressive', exemptAmount: 12399, brackets: [{ threshold: 0, rate: 0.0505 }, { threshold: 51446, rate: 0.0915 }, { threshold: 102894, rate: 0.1116 }] }
        ]
      },
      {
        id: 'BC', name: 'British Columbia', deductibles: [
           { name: 'BC Tax', type: 'progressive', exemptAmount: 12580, brackets: [{ threshold: 0, rate: 0.0506 }, { threshold: 47937, rate: 0.077 }] }
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
        type: 'percentage', 
        rate: 0.22,
        exemptAmount: 88250 // Personfradrag 2024
        // Note: Minstefradrag also exists but is variable. 
      },
      {
        name: 'Bracket Tax (Trinnskatt)',
        type: 'progressive',
        brackets: [
          { threshold: 208050, rate: 0.017 },
          { threshold: 292850, rate: 0.04 },
          { threshold: 670000, rate: 0.136 },
          { threshold: 937900, rate: 0.166 },
          { threshold: 1350000, rate: 0.176 },
        ]
      },
      { name: 'National Insurance (Trygdeavgift)', type: 'percentage', rate: 0.078 }
    ]
  }
};