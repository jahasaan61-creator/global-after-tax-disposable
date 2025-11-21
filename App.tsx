
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CountryCode, UserInputs, CalculationResult } from './types';
import { COUNTRY_RULES } from './constants';
import { calculateNetPay, calculateGrossFromNet } from './services/taxService';
import { GeminiAssistant } from './components/GeminiAssistant';

// Declare jsPDF and html2canvas on Window interface
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

// --- HELPER FUNCTIONS ---

const getFlagUrl = (code: CountryCode) => {
  const map: Record<string, string> = {
      [CountryCode.USA]: 'us', [CountryCode.CHE]: 'ch', [CountryCode.CAN]: 'ca',
      [CountryCode.DEU]: 'de', [CountryCode.IRL]: 'ie', [CountryCode.NZL]: 'nz',
      [CountryCode.NOR]: 'no', [CountryCode.SGP]: 'sg', [CountryCode.BGD]: 'bd',
      [CountryCode.ESP]: 'es', [CountryCode.GBR]: 'gb', [CountryCode.IND]: 'in',
      [CountryCode.JPN]: 'jp', [CountryCode.AUS]: 'au'
  };
  return `https://flagcdn.com/w40/${map[code]}.png`;
};

const getHDFlagUrl = (code: CountryCode) => {
  const map: Record<string, string> = {
      [CountryCode.USA]: 'us', [CountryCode.CHE]: 'ch', [CountryCode.CAN]: 'ca',
      [CountryCode.DEU]: 'de', [CountryCode.IRL]: 'ie', [CountryCode.NZL]: 'nz',
      [CountryCode.NOR]: 'no', [CountryCode.SGP]: 'sg', [CountryCode.BGD]: 'bd',
      [CountryCode.ESP]: 'es', [CountryCode.GBR]: 'gb', [CountryCode.IND]: 'in',
      [CountryCode.JPN]: 'jp', [CountryCode.AUS]: 'au'
  };
  return `https://flagcdn.com/w640/${map[code]}.png`;
};

// --- COMPONENTS ---

// Enhanced Searchable Dropdown
const CurrencyDropdown = ({ value, onChange, className }: { value: CountryCode, onChange: (v: CountryCode) => void, className?: string }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (ref.current && !ref.current.contains(event.target as Node)) {
              setOpen(false);
              setSearch(''); 
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (open && inputRef.current) {
        inputRef.current.focus();
    }
  }, [open]);

  const rule = COUNTRY_RULES[value];
  const filtered = useMemo(() => Object.values(COUNTRY_RULES).filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.currency.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  return (
      <div className={`relative ${className || 'w-[45%] sm:w-[42%]'}`} ref={ref}>
          <button 
              onClick={() => setOpen(!open)}
              className="w-full h-14 pl-3 pr-3 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-2xl flex items-center gap-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-white/50 dark:hover:bg-[#333] transition-all shadow-sm group"
          >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-black/5 dark:border-white/10 shadow-sm shrink-0 group-hover:scale-110 transition-transform bg-white">
                  <img src={getFlagUrl(value)} alt={rule.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{rule.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">{rule.currency} ({rule.code})</span>
              </div>
              <i className="fas fa-chevron-down text-[10px] text-slate-400 ml-auto group-hover:text-blue-500 transition-colors"></i>
          </button>

          {open && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] max-h-[320px] flex flex-col bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#333] z-[60] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-3 border-b border-gray-50 dark:border-[#333] bg-white dark:bg-[#1c1c1e] sticky top-0 z-10">
                      <div className="relative">
                          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                          <input 
                            ref={inputRef}
                            type="text" 
                            placeholder="Search country..." 
                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-[#2c2c2e] rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-1 scrollbar-thin">
                    {filtered.map((c) => (
                        <button 
                            key={c.code}
                            onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors text-left group border-b border-transparent last:border-0 ${c.code === value ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                            <img src={getFlagUrl(c.code)} alt={c.name} className="w-7 h-7 rounded-full object-cover shadow-sm shrink-0 border border-black/5 dark:border-white/10" />
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</span>
                                    <span className="text-[10px] text-slate-500 truncate">({c.code})</span>
                                </div>
                            </div>
                            {c.code === value && <i className="fas fa-check text-blue-500 text-xs ml-auto"></i>}
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-6 text-center">
                            <i className="fas fa-search-minus text-slate-300 text-xl mb-2"></i>
                            <p className="text-xs text-slate-400 font-medium">No countries found</p>
                        </div>
                    )}
                  </div>
              </div>
          )}
      </div>
  );
};

// Region (State/Province) Dropdown
const RegionDropdown = ({ country, value, onChange }: { country: CountryCode, value: string, onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rule = COUNTRY_RULES[country];
  const subRules = rule.subNationalRules || [];

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (ref.current && !ref.current.contains(event.target as Node)) {
              setOpen(false);
              setSearch(''); 
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
        inputRef.current.focus();
    }
  }, [open]);

  const filtered = useMemo(() => subRules.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase())
  ), [subRules, search]);

  // Early return allowed here because hooks have already been called unconditionally above.
  if (!subRules.length) return null;

  const selectedRegion = subRules.find(r => r.id === value);

  return (
      <div className="relative w-full mt-4 z-20" ref={ref}>
           <label className="block text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">{rule.subNationalLabel}</label>
           <button 
              onClick={() => setOpen(!open)}
              className="w-full h-14 pl-3 pr-3 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-2xl flex items-center gap-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-white/50 dark:hover:bg-[#333] transition-all shadow-sm group"
          >
              <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#2c2c2e] flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                 <i className="fas fa-map-marker-alt text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors"></i>
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {selectedRegion ? selectedRegion.name : `Select ${rule.subNationalLabel}`}
                  </span>
              </div>
              <i className="fas fa-chevron-down text-[10px] text-slate-400 ml-auto group-hover:text-blue-500 transition-colors"></i>
          </button>

          {open && (
              <div className="absolute top-full left-0 mt-2 w-full flex flex-col bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#333] z-[60] animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[280px]">
                   <div className="p-3 border-b border-gray-50 dark:border-[#333] bg-white dark:bg-[#1c1c1e] sticky top-0 z-10">
                      <div className="relative">
                          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                          <input 
                            ref={inputRef}
                            type="text" 
                            placeholder={`Search ${rule.subNationalLabel}...`}
                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-[#2c2c2e] rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-1 scrollbar-thin">
                      {filtered.map((r) => (
                        <button 
                            key={r.id}
                            onClick={() => { onChange(r.id); setOpen(false); setSearch(''); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors text-left group border-b border-transparent last:border-0 ${r.id === value ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                             <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#333] flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-500">
                                <span className="text-[10px] font-bold">{r.id.substring(0,2)}</span>
                             </div>
                             <span className="text-xs font-bold text-slate-900 dark:text-white">{r.name}</span>
                             {r.id === value && <i className="fas fa-check text-blue-500 text-xs ml-auto"></i>}
                        </button>
                      ))}
                      {filtered.length === 0 && (
                        <div className="p-6 text-center">
                            <p className="text-xs text-slate-400 font-medium">No regions found</p>
                        </div>
                    )}
                  </div>
              </div>
          )}
      </div>
  );
};

// Custom Hook for Debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const DonutChart: React.FC<{ result: CalculationResult }> = ({ result }) => {
    const gross = result.grossAnnual;
    const safeGross = gross > 0 ? gross : 1; // Prevent division by zero

    const tax = result.totalDeductionsMonthly * 12;
    const costs = result.personalCostsTotal * 12;
    const disposable = Math.max(0, result.netAnnual - costs);
    
    const taxPct = (tax / safeGross) * 100;
    const costsPct = (costs / safeGross) * 100;
    const dispPct = (disposable / safeGross) * 100;
    
    const r = 15.9155;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="relative w-32 h-32 md:w-40 md:h-40 transition-all duration-500 ease-out hover:scale-105">
                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 origin-center">
                    {/* Track */}
                    <circle cx="21" cy="21" r={r} fill="transparent" className="stroke-gray-100 dark:stroke-[#222] transition-colors duration-300" strokeWidth="6" />
                    
                    {/* Tax (Red) - Starts at 0 */}
                    {taxPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#FF3B30" strokeWidth="6" 
                        strokeDasharray={`${taxPct} ${100 - taxPct}`} strokeDashoffset={0} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    )}
                    
                    {/* Costs (Blue) - Starts after Tax */}
                    {costsPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#007AFF" strokeWidth="6"
                        strokeDasharray={`${costsPct} ${100 - costsPct}`} strokeDashoffset={-taxPct} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    )}

                    {/* Disposable (Green) - Starts after Tax + Costs */}
                    {dispPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#34C759" strokeWidth="6"
                        strokeDasharray={`${dispPct} ${100 - dispPct}`} strokeDashoffset={-(taxPct + costsPct)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 dark:text-white">
                    <span className="text-xl font-extrabold tracking-tight animate-in fade-in zoom-in duration-500">{gross > 0 ? ((result.netAnnual / gross) * 100).toFixed(0) : '0'}%</span>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.5)]"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Tax</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.5)]"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Costs</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Free</span>
                </div>
            </div>
        </div>
    );
};

type CalcMode = 'gross' | 'net';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<UserInputs>({
    grossIncome: 50000,
    frequency: 'annual',
    country: CountryCode.USA,
    costs: { rent: 0, groceries: 0, utilities: 0, transport: 0, insurance: 0, emergencyFund: 0, debt: 0, freedomFund: 0 },
    details: { age: 30, maritalStatus: 'single', churchTax: false },
    annualBonus: 0
  });

  const [mode, setMode] = useState<CalcMode>('gross');
  const [targetNet, setTargetNet] = useState<number>(40000);
  const [showSources, setShowSources] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('gnp_theme');
          if (saved) return saved === 'dark';
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
  });

  // Debounce inputs to improve performance - Reduced delay for snappier UI
  const debouncedInputs = useDebounce(inputs, 250);
  const debouncedTargetNet = useDebounce(targetNet, 250);

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<CountryCode>(CountryCode.USA);
  const [toCurrency, setToCurrency] = useState<CountryCode>(CountryCode.DEU);
  
  const debouncedConvertAmount = useDebounce(convertAmount, 250);

  const currentRules = COUNTRY_RULES[inputs.country];

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('gnp_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('country')) {
        const c = params.get('country') as CountryCode;
        const g = parseFloat(params.get('gross') || '0');
        const f = params.get('frequency') as 'monthly' | 'annual';
        
        // Load all costs
        const rent = parseFloat(params.get('rent') || '0');
        const groceries = parseFloat(params.get('groceries') || '0');
        const utilities = parseFloat(params.get('utilities') || '0');
        const transport = parseFloat(params.get('transport') || '0');
        const insurance = parseFloat(params.get('insurance') || '0');
        const emergencyFund = parseFloat(params.get('emergencyFund') || '0');
        const debt = parseFloat(params.get('debt') || '0');
        const freedomFund = parseFloat(params.get('freedomFund') || '0');
        const bonus = parseFloat(params.get('bonus') || '0');

        if (c && COUNTRY_RULES[c]) {
            setInputs(prev => ({
                ...prev,
                country: c,
                grossIncome: g,
                frequency: f || 'annual',
                annualBonus: bonus,
                costs: { ...prev.costs, rent, groceries, utilities, transport, insurance, emergencyFund, debt, freedomFund }
            }));
        }
    } else {
        // Load from localStorage if no URL params
        const saved = localStorage.getItem('gnp_inputs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge for robustness
                setInputs(prev => ({ 
                    ...prev, 
                    ...parsed,
                    costs: { ...prev.costs, ...(parsed.costs || {}) },
                    details: { ...prev.details, ...(parsed.details || {}) }
                }));
            } catch (e) {}
        }
    }
  }, []);

  // Persistence Effect
  useEffect(() => {
      localStorage.setItem('gnp_inputs', JSON.stringify(inputs));
  }, [inputs]);

  // OPTIMIZATION: Use useMemo instead of useEffect for synchronous heavy calculations to prevent extra render cycles
  const result = useMemo(() => {
      let incomeToUse = debouncedInputs.grossIncome;
      if (mode === 'net') {
          incomeToUse = calculateGrossFromNet(debouncedTargetNet, { ...debouncedInputs, grossIncome: 0 });
      }
      const finalInputs = { ...debouncedInputs, grossIncome: incomeToUse };
      return calculateNetPay(finalInputs);
  }, [debouncedInputs, mode, debouncedTargetNet]);

  // OPTIMIZATION: Memoize currency conversion
  const convertedResult = useMemo(() => {
      const fromRate = COUNTRY_RULES[fromCurrency].exchangeRatePerUSD;
      const toRate = COUNTRY_RULES[toCurrency].exchangeRatePerUSD;
      if (fromRate && toRate) {
          // Convert to USD first, then to Target
          const amountInUSD = debouncedConvertAmount / fromRate;
          return amountInUSD * toRate;
      }
      return 0;
  }, [debouncedConvertAmount, fromCurrency, toCurrency]);

  // Derived values for Breakdown
  const employeeDeductions = result ? result.deductionsBreakdown.filter(d => !d.isEmployer) : [];
  const employerDeductions = result ? result.deductionsBreakdown.filter(d => d.isEmployer) : [];

  const getRateDisplay = () => {
    const from = COUNTRY_RULES[fromCurrency];
    const to = COUNTRY_RULES[toCurrency];
    const rate = to.exchangeRatePerUSD / from.exchangeRatePerUSD;
    return `1 ${from.currency} ≈ ${rate.toFixed(4)} ${to.currency}`;
  };

  const applyToCalculator = () => {
    setInputs(prev => ({
        ...prev,
        country: toCurrency, // Switch main calculator to target country
        grossIncome: parseFloat(convertedResult.toFixed(0)), // Set income
        subRegion: undefined 
    }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCostChange = (key: keyof UserInputs['costs'], val: string) => {
    const num = parseFloat(val) || 0;
    setInputs(prev => ({
      ...prev,
      costs: { ...prev.costs, [key]: num }
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currentRules.currency,
      maximumFractionDigits: 0 
    }).format(amount);
  };
  
  const formatCompact = (amount: number) => {
     return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currentRules.currency,
        notation: 'compact',
        maximumFractionDigits: 0
     }).format(amount);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('pdf-invoice-template');
    if (!element || !window.jspdf || !window.html2canvas) {
        alert("PDF library loading... please try again in a second.");
        return;
    }

    try {
        document.body.style.cursor = 'wait';
        // Render hidden invoice template
        const canvas = await window.html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        // A4 size
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Payslip_${inputs.country}_${dateStr}.pdf`;
        
        pdf.save(fileName);
        document.body.style.cursor = 'default';
    } catch (e) {
        console.error(e);
        alert("Failed to generate PDF");
        document.body.style.cursor = 'default';
    }
  };

  const shareLink = () => {
      const baseUrl = window.location.origin + window.location.pathname;
      const url = new URL(baseUrl);
      
      url.searchParams.set('country', inputs.country);
      const grossToShare = result ? result.grossAnnual : 0;
      url.searchParams.set('gross', grossToShare.toString());
      url.searchParams.set('frequency', 'annual'); 
      url.searchParams.set('bonus', inputs.annualBonus.toString());

      Object.keys(inputs.costs).forEach(key => {
          const val = (inputs.costs as any)[key];
          url.searchParams.set(key, val.toString());
      });
      
      navigator.clipboard.writeText(url.toString()).then(() => {
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
      });
  };

  const costFields = [
    { key: 'rent', label: 'Rent' },
    { key: 'groceries', label: 'Groceries' },
    { key: 'utilities', label: 'Utilities' },
    { key: 'transport', label: 'Transport' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'debt', label: 'Debt / Loans' },
    { key: 'emergencyFund', label: 'Emergency Fund' },
    { key: 'freedomFund', label: 'Freedom/Runway Fund' }
  ];
  
  // Dynamic Income Presets
  const getIncomePresets = () => {
     const rate = currentRules.exchangeRatePerUSD;
     // Base USD steps: 40k, 80k, 120k, 200k
     const bases = [40000, 80000, 120000, 200000];
     return bases.map(b => {
         const val = b * rate;
         // Round to nearest thousand for clean UI
         return Math.round(val / 1000) * 1000;
     });
  };

  const incomePresets = getIncomePresets();

  // Reusable iOS-style Segmented Control
  const SegmentedControl = ({ options, value, onChange, dark }: { options: {label: string, value: string}[], value: string, onChange: (v: any) => void, dark?: boolean }) => (
    <div className={`${dark ? 'bg-black/30' : 'bg-slate-200/80 dark:bg-[#1c1c1e]'} p-1 rounded-[14px] flex relative select-none cursor-pointer shadow-inner border border-transparent dark:border-[#333]`}>
        {options.map((opt) => (
            <button 
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-2 px-3 text-sm font-extrabold rounded-[10px] transition-all duration-200 active:scale-95 ${
                    value === opt.value 
                        ? (dark ? 'bg-white/90 text-slate-900' : 'bg-white dark:bg-[#333] text-black dark:text-white') + ' shadow-[0_2px_8px_rgba(0,0,0,0.12)] transform scale-[1.02]' 
                        : (dark ? 'text-white/60 hover:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#050505] transition-colors duration-300 selection:bg-blue-500/30">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-[#222]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg text-yellow-400 overflow-hidden border-2 border-white/20">
                    <i className="fas fa-coins text-2xl"></i>
                </div>
                <h1 className="text-xl font-bold tracking-tight hidden sm:block dark:text-white">Global Net Pay</h1>
            </div>
            <div className="flex gap-3 items-center">
                <button 
                    onClick={shareLink}
                    className="h-9 px-5 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-[#333] text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-[#222] transition shadow-sm flex items-center gap-2 active:scale-95 duration-150"
                >
                    {copyFeedback ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-share-square text-blue-500"></i>}
                    {copyFeedback ? 'Copied!' : 'Share'}
                </button>
                <button 
                    onClick={() => setShowSources(!showSources)}
                    className="h-9 w-9 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-[#333] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#222] transition shadow-sm active:scale-95 duration-150"
                    title="Data Sources"
                >
                    <i className="fas fa-info text-slate-500 dark:text-slate-400 text-sm"></i>
                </button>
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="h-9 w-9 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-[#333] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#222] transition shadow-sm active:scale-95 duration-150 text-yellow-500 dark:text-blue-300"
                    title="Toggle Theme"
                >
                    {darkMode ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {showSources && (
             <div className="mb-8 bg-white dark:bg-[#101012] border border-orange-100 dark:border-[#333] p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-2 mb-3 text-orange-600">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3 className="font-bold text-sm">Data Sources & Disclaimers</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 font-medium">
                    This tool provides estimates based on 2024/2025 statutory rules. It is not legal or financial advice.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {currentRules.sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-lg font-medium">
                            <i className="fas fa-external-link-alt text-xs"></i> {s.label} <span className="text-gray-400 text-xs ml-auto">{s.date}</span>
                        </a>
                    ))}
                </div>
             </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Income Section */}
            <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] transition-all duration-300 hover:shadow-2xl">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-[#0034b8] to-[#0c58fa] p-6 md:p-8 pb-10 relative text-white rounded-t-[32px]">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                     <div className="relative z-10 flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-sack-dollar text-white"></i>
                                </div>
                                <h2 className="text-xl font-extrabold tracking-tight">Income</h2>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wide w-fit">
                                <i className="fas fa-calendar-alt text-[9px]"></i> Tax Year 2024/25
                            </span>
                        </div>
                        <div className="w-40">
                             <SegmentedControl 
                                options={[{label: 'Gross', value: 'gross'}, {label: 'Net', value: 'net'}]}
                                value={mode}
                                onChange={setMode}
                                dark={true}
                            />
                        </div>
                     </div>
                </div>

                <div className="p-6 md:p-8 -mt-4 bg-white dark:bg-[#101012] rounded-b-[32px] rounded-t-[32px] relative z-20 space-y-5">
                    <div className="relative z-30">
                        <label className="block text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Where do you live?</label>
                        <CurrencyDropdown 
                            value={inputs.country} 
                            onChange={(val) => setInputs({...inputs, country: val, subRegion: undefined })} 
                            className="w-full"
                        />
                    </div>

                    <RegionDropdown 
                        country={inputs.country}
                        value={inputs.subRegion || ''}
                        onChange={(val) => setInputs({...inputs, subRegion: val })}
                    />

                    <div className="relative z-10 pt-2">
                        <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                             <label className="text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider">
                                {mode === 'gross' ? 'Gross Income' : 'Desired Net Income'}
                            </label>
                            {/* Frequency Toggle embedded near label */}
                        </div>
                        
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-extrabold z-10 transition-colors group-focus-within:text-blue-500">
                                {currentRules.currencySymbol}
                            </span>
                            <input 
                                type="number" 
                                min="0"
                                autoComplete="off"
                                className={`w-full p-4 pl-10 pr-32 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-2xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#2c2c2e] focus:ring-2 ${mode === 'net' ? 'focus:ring-green-500/20' : 'focus:ring-blue-500/20'} outline-none transition-all font-extrabold text-xl tracking-tight`}
                                value={mode === 'gross' ? inputs.grossIncome : targetNet}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    mode === 'gross' ? setInputs({...inputs, grossIncome: val}) : setTargetNet(val);
                                }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 scale-100 origin-right">
                                <SegmentedControl 
                                    options={[{label: 'Yr', value: 'annual'}, {label: 'Mo', value: 'monthly'}]}
                                    value={inputs.frequency}
                                    onChange={(v) => setInputs({...inputs, frequency: v})}
                                />
                            </div>
                        </div>

                        {/* Income Range Slider & Presets */}
                        <div className="mt-3 px-1">
                            <input
                                type="range"
                                min="0"
                                max={Math.max(inputs.grossIncome * 2.5, incomePresets[incomePresets.length-1] * 1.2)}
                                step={1000}
                                value={mode === 'gross' ? inputs.grossIncome : targetNet}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    mode === 'gross' ? setInputs({...inputs, grossIncome: val}) : setTargetNet(val);
                                }}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 hover:accent-blue-500 transition-all"
                            />
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                                {incomePresets.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => mode === 'gross' ? setInputs({...inputs, grossIncome: preset}) : setTargetNet(preset)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1c1c1e] text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800 whitespace-nowrap"
                                    >
                                        {formatCompact(preset)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bonus & Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-2 relative z-0">
                         {/* Annual Bonus Input */}
                        <div className="col-span-1">
                            <label className="block text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1 truncate" title="Bonus / 13th Month">Bonus / 13th</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm z-10 transition-colors group-focus-within:text-blue-500">
                                    {currentRules.currencySymbol}
                                </span>
                                <input 
                                    type="number" 
                                    min="0"
                                    autoComplete="off"
                                    placeholder="0"
                                    className="w-full p-3 pl-8 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-2xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#2c2c2e] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-sm"
                                    value={inputs.annualBonus || ''}
                                    onChange={(e) => setInputs({...inputs, annualBonus: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                        </div>
                        
                        <div className="col-span-1">
                             <label className="block text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Age</label>
                             <input 
                                type="number" 
                                min="15" max="99"
                                autoComplete="off"
                                className="w-full p-3 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-2xl focus:bg-white dark:focus:bg-[#2c2c2e] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-center font-bold text-slate-900 dark:text-white text-sm"
                                value={inputs.details.age}
                                onChange={(e) => setInputs({...inputs, details: { ...inputs.details, age: parseInt(e.target.value) || 30 }})}
                            />
                        </div>

                        {currentRules.hasMaritalStatusOption && (
                             <div className="col-span-2">
                                <label className="block text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Marital Status</label>
                                <div className="grid grid-cols-2 gap-2 bg-[#F2F2F7] dark:bg-[#1c1c1e] p-1 rounded-xl">
                                     {['single', 'married'].map(status => (
                                         <button
                                            key={status}
                                            onClick={() => setInputs({...inputs, details: { ...inputs.details, maritalStatus: status as any }})}
                                            className={`py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all ${
                                                inputs.details.maritalStatus === status 
                                                ? 'bg-white dark:bg-[#333] shadow-sm text-blue-600 dark:text-blue-400' 
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                         >
                                             {status}
                                         </button>
                                     ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {currentRules.hasChurchTaxOption && (
                         <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#1c1c1e] rounded-2xl border border-transparent hover:border-blue-500/20 transition-colors cursor-pointer" onClick={() => setInputs({...inputs, details: { ...inputs.details, churchTax: !inputs.details.churchTax }})}>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer pointer-events-none">Apply Church Tax</label>
                            <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${inputs.details.churchTax ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${inputs.details.churchTax ? 'translate-x-4' : ''}`}></div>
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Costs Section - Improved Functionality */}
            <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 md:p-8 pb-10 relative text-white shrink-0">
                     <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none"></div>
                     <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                <i className="fas fa-receipt text-white"></i>
                            </div>
                            <h2 className="text-xl font-extrabold tracking-tight">Monthly Costs</h2>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">Optional</span>
                     </div>
                </div>

                <div className="p-6 md:p-8 -mt-4 bg-white dark:bg-[#101012] rounded-t-[32px] relative z-20 flex-grow flex flex-col">
                    
                    {/* NEW: Budget Dashboard */}
                    {result && result.netMonthly > 0 && (
                        <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-[#2c2c2e] animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Budget Used</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                         <span className={`text-xl font-extrabold ${result.personalCostsTotal > result.netMonthly ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                            {((result.personalCostsTotal / result.netMonthly) * 100).toFixed(0)}%
                                         </span>
                                         <span className="text-[11px] font-bold text-slate-400">of Net Pay</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Remaining</p>
                                    <p className={`text-xl font-extrabold ${result.disposableMonthly < 0 ? 'text-red-500' : 'text-[#34C759]'}`}>
                                        {formatCurrency(result.disposableMonthly)}
                                    </p>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-2.5 bg-gray-200 dark:bg-[#333] rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                                        (result.personalCostsTotal / result.netMonthly) > 1 ? 'bg-red-500' : 
                                        (result.personalCostsTotal / result.netMonthly) > 0.8 ? 'bg-yellow-500' : 'bg-[#34C759]'
                                    }`}
                                    style={{ width: `${Math.min(((result.personalCostsTotal / result.netMonthly) * 100), 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        {costFields.map((field) => {
                            const val = (inputs.costs as any)[field.key];
                            const pct = (result && result.netMonthly > 0 && val > 0) ? (val / result.netMonthly) * 100 : 0;
                            return (
                            <div key={field.key} className="relative">
                                <div className="flex justify-between items-center mb-1.5 ml-1">
                                    <label className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 whitespace-nowrap">{field.label}</label>
                                    {pct > 1 && (
                                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pct > 50 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-[#2c2c2e] dark:text-slate-400'}`}>
                                            {pct.toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">{currentRules.currencySymbol}</span>
                                    </div>
                                    <input 
                                        type="number"
                                        min="0"
                                        autoComplete="off"
                                        className="w-full p-2.5 pl-7 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#2c2c2e] focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-sm"
                                        value={val || ''}
                                        placeholder="0"
                                        onChange={(e) => handleCostChange(field.key as any, e.target.value)}
                                    />
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-6" id="results-panel">
             {result && (
                 <>
                    {/* Hero Card (Gross) - Enhanced Interactive 3D Version */}
                    <div 
                        className="relative rounded-[32px] shadow-2xl overflow-hidden group border border-white/10 transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] h-auto min-h-[200px] perspective-1000"
                        style={{ perspective: '1000px' }}
                    >
                        <div className="absolute inset-0 z-0 transform-style-3d transition-transform duration-700 group-hover:rotate-x-2 group-hover:rotate-y-2 group-hover:scale-105 origin-center">
                             {/* Dynamic HD Flag */}
                             <img 
                                src={getHDFlagUrl(inputs.country)} 
                                alt="Country Flag" 
                                className="w-full h-full object-cover contrast-125 saturate-[1.1] brightness-75 dark:brightness-50"
                             />
                             {/* Cinematic Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 mix-blend-multiply"></div>
                             
                             {/* Moving Sheen/Shimmer */}
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                        </div>

                        {/* Content Layer - RESIZED and REALIGNED for better stacking on large mobile/tablets */}
                        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                                        <i className="fas fa-briefcase text-xl text-white drop-shadow-md"></i>
                                    </div>
                                    <p className="text-white/90 text-base md:text-lg font-bold uppercase tracking-wider shadow-black drop-shadow-md">
                                        {mode === 'net' ? 'Required Gross Annual' : 'Gross Annual Income'}
                                    </p>
                                </div>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl mt-2 leading-none break-words">
                                    {formatCurrency(result.grossAnnual)}
                                </h2>
                            </div>
                            
                            {/* Enlarged Monthly Button - Full width on tablet/mobile stack */}
                            <div className="flex flex-col items-start lg:items-end gap-2 pb-1 w-full lg:w-auto">
                                 <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:bg-white/20 group-hover:translate-x-0 lg:group-hover:translate-x-[-5px] w-full lg:w-auto justify-between lg:justify-start">
                                     <span className="text-white/90 text-xs font-extrabold uppercase tracking-wide drop-shadow-sm whitespace-nowrap">Monthly</span>
                                     <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-md break-all">{formatCurrency(result.grossMonthly)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[240px]">
                        {/* Net Pay Card */}
                        <div className="bg-gradient-to-br from-[#007AFF] to-[#0055ff] p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden group border border-white/10 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl">
                            <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <i className="fas fa-money-bill-wave"></i>
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10">
                                        <i className="fas fa-wallet text-lg text-white"></i>
                                    </div>
                                    <div className="text-white/90 text-[13px] font-bold uppercase tracking-wider leading-tight">
                                        <div>Net Monthly</div>
                                        <div>Pay</div>
                                    </div>
                                </div>

                                <div className="mt-6 mb-4">
                                    <h3 className={`font-extrabold text-white tracking-tight leading-none break-words ${currentRules.currency.length > 3 || result.netMonthly > 99999 ? 'text-3xl' : 'text-4xl'}`}>
                                        {formatCurrency(result.netMonthly)}
                                    </h3>
                                </div>

                                <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                                    <div>
                                        <p className="text-white/70 text-[11px] uppercase font-bold mb-1">Annual Net</p>
                                        <p className="text-white font-extrabold text-xl">{formatCurrency(result.netAnnual)}</p>
                                    </div>
                                    <i className="fas fa-arrow-right text-white/50 text-sm group-hover:text-white group-hover:translate-x-1 transition-all mb-1"></i>
                                </div>
                            </div>
                        </div>

                        {/* Disposable Card */}
                        <div className="bg-gradient-to-br from-[#34C759] to-[#2a9d48] p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden group border border-white/10 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl">
                             <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <i className="fas fa-star"></i>
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10">
                                        <i className="fas fa-smile-beam text-lg text-white"></i>
                                    </div>
                                    <div className="text-white/90 text-[13px] font-bold uppercase tracking-wider leading-tight">
                                        <div>Disposable</div>
                                        <div>Monthly</div>
                                    </div>
                                </div>

                                <div className="mt-6 mb-4">
                                    <h3 className={`font-extrabold text-white tracking-tight leading-none break-words ${currentRules.currency.length > 3 || result.disposableMonthly > 99999 ? 'text-3xl' : 'text-4xl'}`}>
                                        {formatCurrency(result.disposableMonthly)}
                                    </h3>
                                </div>

                                <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                                    <div>
                                        <p className="text-white/70 text-[11px] uppercase font-bold mb-1">Annual Disposable</p>
                                        <p className="text-white font-extrabold text-xl">{formatCurrency(result.disposableMonthly * 12)}</p>
                                    </div>
                                    <i className="fas fa-arrow-right text-white/50 text-sm group-hover:text-white group-hover:translate-x-1 transition-all mb-1"></i>
                                </div>
                            </div>
                        </div>
                        
                        {/* Chart Card */}
                        <div className="bg-white dark:bg-[#101012] p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] text-slate-900 dark:text-white relative overflow-hidden group flex flex-col justify-between h-full transition-all duration-300 hover:shadow-2xl">
                             <div className="absolute -right-8 -bottom-8 text-slate-50 dark:text-[#18181b] text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <i className="fas fa-chart-pie"></i>
                             </div>
                             <div className="relative z-10 w-full h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                     <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center border border-slate-50 dark:border-[#333]">
                                        <i className="fas fa-chart-pie text-lg text-slate-900 dark:text-white"></i>
                                     </div>
                                     <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold uppercase tracking-wider">Tax / Cost Ratio</p>
                                </div>
                                <div className="flex-grow flex items-center justify-center mt-2">
                                    <DonutChart result={result} />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Quick Convert Horizontal Card */}
                    <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] transition-all duration-300 hover:shadow-2xl group/converter relative z-30">
                         <div className="bg-gradient-to-r from-[#2FB050] to-[#A0E870] p-5 relative flex items-center justify-between text-white overflow-hidden rounded-t-[32px]">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-32 pointer-events-none"></div>
                             <div className="flex items-center gap-3 relative z-10">
                                 <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-exchange-alt text-white"></i>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg tracking-tight text-white leading-none">Quick Convert</h3>
                                    <p className="text-white/80 text-xs font-medium mt-1">{getRateDisplay()}</p>
                                </div>
                             </div>
                             {/* Decoration */}
                             <i className="fas fa-coins text-white/20 text-6xl absolute -right-4 -bottom-8 rotate-12"></i>
                         </div>
                         
                         <div className="p-6">
                             <div className="flex flex-col md:flex-row items-end gap-4 relative">
                                 
                                 {/* FROM */}
                                 <div className="flex-1 w-full space-y-2">
                                    <div className="flex justify-between px-1">
                                        <label className="text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider">From</label>
                                        <span className="text-[10px] font-bold text-slate-400">{COUNTRY_RULES[fromCurrency].name}</span>
                                    </div>
                                     <div className="flex gap-3">
                                        <CurrencyDropdown value={fromCurrency} onChange={setFromCurrency} />
                                        <div className="relative flex-1">
                                            <input 
                                                type="number"
                                                value={convertAmount}
                                                onChange={(e) => setConvertAmount(parseFloat(e.target.value) || 0)}
                                                className="w-full h-14 pl-4 pr-4 bg-[#F2F2F7] dark:bg-[#1c1c1e] border-none rounded-2xl text-slate-900 dark:text-white font-extrabold text-lg outline-none focus:ring-2 focus:ring-[#2FB050]/20 transition-all shadow-inner"
                                            />
                                        </div>
                                     </div>
                                 </div>

                                 {/* SWAP BUTTON */}
                                 <button 
                                     onClick={() => {
                                         setFromCurrency(toCurrency);
                                         setToCurrency(fromCurrency);
                                     }}
                                     className="absolute left-1/2 -translate-x-1/2 bottom-[22px] md:static md:translate-x-0 md:mb-2 w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2c2c2e] flex items-center justify-center text-slate-500 hover:bg-[#2FB050] hover:text-white transition-all active:scale-90 shadow-md hover:shadow-lg z-10"
                                 >
                                     <i className="fas fa-exchange-alt"></i>
                                 </button>

                                 {/* TO */}
                                 <div className="flex-1 w-full space-y-2">
                                    <div className="flex justify-between px-1">
                                        <label className="text-[11px] font-extrabold text-[#86868b] dark:text-slate-500 uppercase tracking-wider">To</label>
                                        <span className="text-[10px] font-bold text-slate-400">{COUNTRY_RULES[toCurrency].name}</span>
                                    </div>
                                     <div className="flex gap-3">
                                        <CurrencyDropdown value={toCurrency} onChange={setToCurrency} />
                                        <div className="relative flex-1">
                                            <div className="w-full h-14 pl-4 pr-4 bg-[#2FB050]/5 border border-[#2FB050]/20 rounded-2xl flex items-center text-[#2a8f43] dark:text-[#4ade80] font-extrabold text-lg overflow-hidden shadow-sm">
                                                {new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(convertedResult)}
                                            </div>
                                        </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Footer Actions */}
                             <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#222] flex flex-col sm:flex-row justify-between items-center gap-3">
                                 <p className="text-[10px] text-slate-400 font-semibold text-center sm:text-left">
                                    <i className="fas fa-clock mr-1"></i> 
                                    Real-time estimate. Rates update daily.
                                 </p>
                                 <button 
                                    onClick={applyToCalculator}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
                                 >
                                     <span>Use this Salary</span>
                                     <i className="fas fa-arrow-up transform rotate-45"></i>
                                 </button>
                             </div>
                         </div>
                    </div>

                    {/* Detailed Breakdown Table */}
                    <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] overflow-hidden transition-all duration-300 hover:shadow-2xl relative z-10">
                         {/* Gradient Header */}
                        <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 flex justify-between items-center relative">
                             <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                             <div className="relative z-10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-list-alt text-white"></i>
                                </div>
                                <h3 className="font-extrabold text-lg text-white tracking-tight">Payslip Breakdown</h3>
                             </div>
                             <button onClick={downloadPDF} className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-colors backdrop-blur-md active:scale-95 duration-150">
                                <i className="fas fa-arrow-down-to-line"></i> Get PDF
                            </button>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="text-xs text-[#86868b] dark:text-slate-400 uppercase font-bold bg-[#F5F5F7] dark:bg-[#18181b] border-b border-gray-100 dark:border-[#333]">
                                    <tr>
                                        <th className="px-6 py-4 pl-8">Description</th>
                                        <th className="px-6 py-4 text-right">Annual</th>
                                        <th className="px-6 py-4 text-right">Monthly</th>
                                        <th className="px-6 py-4 text-right w-24">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-[#222]">
                                    {/* Earnings Section */}
                                    <tr className="bg-slate-50/50 dark:bg-[#151517]">
                                        <td colSpan={4} className="px-6 py-2 pl-8 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Earnings</td>
                                    </tr>
                                    <tr className="text-slate-900 dark:text-white">
                                        <td className="px-6 py-4 pl-8 font-bold flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><i className="fas fa-briefcase text-[10px]"></i></div>
                                            Base Salary
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(result.grossAnnual)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(result.grossMonthly)}</td>
                                        <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-500 font-semibold">100%</td>
                                    </tr>
                                    {inputs.annualBonus > 0 && (
                                         <tr className="text-slate-900 dark:text-white">
                                            <td className="px-6 py-4 pl-8 font-bold flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><i className="fas fa-gift text-[10px]"></i></div>
                                                Annual Bonus
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold">{formatCurrency(inputs.annualBonus)}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-400">-</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-400">-</td>
                                        </tr>
                                    )}

                                    {/* Deductions Section */}
                                    <tr className="bg-slate-50/50 dark:bg-[#151517]">
                                        <td colSpan={4} className="px-6 py-2 pl-8 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Deductions</td>
                                    </tr>
                                    {employeeDeductions.length > 0 ? (
                                        employeeDeductions.map((d, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#1c1c1e] transition-colors text-[#FF3B30] dark:text-red-400">
                                            <td className="px-6 py-4 pl-8 flex items-center group font-bold">
                                                <span className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mr-3"><i className="fas fa-minus text-[10px]"></i></span>
                                                {d.name}
                                                {d.description && (
                                                    <div className="relative ml-2">
                                                        <i className="fas fa-info-circle text-gray-300 dark:text-slate-600 hover:text-blue-400 cursor-help transition-colors"></i>
                                                        <div className="absolute left-0 bottom-6 w-64 bg-[#1d1d1f] dark:bg-black text-white text-xs p-3 rounded-xl shadow-xl hidden group-hover:block z-20 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
                                                            {d.description}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">-{formatCurrency(d.amount)}</td>
                                            <td className="px-6 py-4 text-right font-medium">-{formatCurrency(d.amount / 12)}</td>
                                            <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-500 font-medium">
                                                {(d.amount / (result.grossAnnual || 1) * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-slate-400 text-sm italic">No employee deductions found.</td>
                                        </tr>
                                    )}
                                    
                                    {/* Net Pay Row */}
                                    <tr className="bg-blue-50/50 dark:bg-[#007AFF]/10 text-slate-900 dark:text-white border-t-2 border-blue-100 dark:border-blue-900">
                                        <td className="px-6 py-4 pl-8 font-extrabold flex items-center gap-3 text-blue-700 dark:text-blue-400">
                                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md"><i className="fas fa-check text-[10px]"></i></div>
                                            Net Pay
                                        </td>
                                        <td className="px-6 py-4 text-right font-extrabold text-blue-700 dark:text-blue-400">{formatCurrency(result.netAnnual)}</td>
                                        <td className="px-6 py-4 text-right font-extrabold text-blue-700 dark:text-blue-400">{formatCurrency(result.netMonthly)}</td>
                                        <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                                            {(result.netAnnual / (result.grossAnnual || 1) * 100).toFixed(1)}%
                                        </td>
                                    </tr>

                                    {/* Employer Section */}
                                    {employerDeductions.length > 0 && (
                                        <>
                                            <tr className="bg-slate-50/50 dark:bg-[#151517]">
                                                <td colSpan={4} className="px-6 py-2 pl-8 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Employer Contributions (Informational)</td>
                                            </tr>
                                            {employerDeductions.map((d, idx) => (
                                                <tr key={`emp-${idx}`} className="text-slate-400 dark:text-slate-500 italic">
                                                    <td className="px-6 py-3 pl-8 flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#2c2c2e] flex items-center justify-center text-slate-500"><i className="fas fa-building text-[10px]"></i></div>
                                                        {d.name}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">{formatCurrency(d.amount)}</td>
                                                    <td className="px-6 py-3 text-right">{formatCurrency(d.amount / 12)}</td>
                                                    <td className="px-6 py-3 text-right">-</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="text-center pt-4 pb-8">
                         <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Calculations are estimates based on {currentRules.name} tax laws.</p>
                    </div>
                 </>
             )}
          </div>
        </div>
      </main>

      {/* High Fidelity PDF Template - Hidden from view but accessible to html2canvas */}
      {result && (
          <div id="pdf-invoice-template" className="fixed top-0 left-[-2000px] w-[210mm] min-h-[297mm] bg-white text-slate-900 p-12 font-sans box-border" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {/* Header */}
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center text-3xl">
                          <i className="fas fa-globe"></i>
                      </div>
                      <div>
                          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900">Global Net Pay</h1>
                          <p className="text-slate-500 font-medium text-sm">Salary Estimation Statement</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Statement Date</p>
                      <p className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-sm text-slate-500 mt-1">Currency: {currentRules.currency} ({currentRules.name})</p>
                  </div>
              </div>

              {/* Employee Summary */}
              <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-100 flex justify-between">
                  <div>
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Employee Profile</h3>
                      <p className="text-sm font-bold text-slate-800"><span className="w-20 inline-block text-slate-500 font-medium">Age:</span> {inputs.details.age}</p>
                      <p className="text-sm font-bold text-slate-800"><span className="w-20 inline-block text-slate-500 font-medium">Status:</span> {inputs.details.maritalStatus}</p>
                      <p className="text-sm font-bold text-slate-800"><span className="w-20 inline-block text-slate-500 font-medium">Location:</span> {currentRules.name} {inputs.subRegion ? `(${inputs.subRegion})` : ''}</p>
                  </div>
                  <div className="text-right">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Gross Annual Pay</h3>
                      <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(result.grossAnnual)}</p>
                  </div>
              </div>

              {/* Main Breakdown Columns */}
              <div className="flex gap-8 mb-8">
                  {/* Left: Earnings */}
                  <div className="flex-1">
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Earnings</h3>
                      <table className="w-full text-sm">
                          <thead>
                              <tr className="text-slate-400 text-xs uppercase text-left">
                                  <th className="pb-2 font-medium">Item</th>
                                  <th className="pb-2 font-medium text-right">Amount</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              <tr>
                                  <td className="py-3 font-bold text-slate-700">Basic Salary</td>
                                  <td className="py-3 font-bold text-slate-900 text-right">{formatCurrency(result.grossAnnual)}</td>
                              </tr>
                              {inputs.annualBonus > 0 && (
                                  <tr>
                                      <td className="py-3 font-bold text-slate-700">Annual Bonus</td>
                                      <td className="py-3 font-bold text-slate-900 text-right">{formatCurrency(inputs.annualBonus)}</td>
                                  </tr>
                              )}
                              <tr className="bg-slate-50">
                                  <td className="py-3 font-bold text-slate-900 pl-2">Total Earnings</td>
                                  <td className="py-3 font-bold text-slate-900 text-right pr-2">{formatCurrency(result.grossAnnual + inputs.annualBonus)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  {/* Right: Deductions */}
                  <div className="flex-1">
                      <h3 className="text-sm font-bold uppercase text-red-600 border-b-2 border-red-100 pb-2 mb-4">Deductions (Taxes)</h3>
                      <table className="w-full text-sm">
                          <thead>
                              <tr className="text-slate-400 text-xs uppercase text-left">
                                  <th className="pb-2 font-medium">Description</th>
                                  <th className="pb-2 font-medium text-right">Annual</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {employeeDeductions.map((d, i) => (
                                  <tr key={i}>
                                      <td className="py-3 font-medium text-slate-600">{d.name}</td>
                                      <td className="py-3 font-bold text-red-600 text-right">-{formatCurrency(d.amount)}</td>
                                  </tr>
                              ))}
                              <tr className="bg-red-50">
                                  <td className="py-3 font-bold text-red-700 pl-2">Total Deductions</td>
                                  <td className="py-3 font-bold text-red-700 text-right pr-2">-{formatCurrency(result.grossAnnual - result.netAnnual)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Net Pay Highlight */}
              <div className="bg-slate-900 text-white p-6 rounded-lg flex justify-between items-center mb-8 shadow-lg">
                  <div>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Net Pay (Take Home)</p>
                      <p className="text-xs text-slate-500">Excludes employer contributions</p>
                  </div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold">{formatCurrency(result.netAnnual)}</p>
                      <p className="text-sm text-slate-400 font-medium mt-1">/ Year</p>
                  </div>
                  <div className="h-12 w-px bg-slate-700 mx-6"></div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold text-blue-400">{formatCurrency(result.netMonthly)}</p>
                      <p className="text-sm text-blue-300 font-medium mt-1">/ Month</p>
                  </div>
              </div>

              {/* Financial Health / Budget Analysis */}
              {result.personalCostsTotal > 0 && (
                  <div className="mb-8 border border-slate-200 rounded-lg p-6">
                      <h3 className="text-sm font-bold uppercase text-slate-900 mb-4 flex items-center gap-2">
                          <i className="fas fa-chart-pie text-slate-400"></i> Financial Health Analysis
                      </h3>
                      <div className="flex gap-8">
                          <div className="w-1/2">
                              <table className="w-full text-sm">
                                  <tbody className="divide-y divide-slate-100">
                                      {Object.entries(inputs.costs).map(([key, val]) => (val as number) > 0 && (
                                          <tr key={key}>
                                              <td className="py-2 capitalize text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</td>
                                              <td className="py-2 font-bold text-right">{formatCurrency(val as number)}</td>
                                          </tr>
                                      ))}
                                      <tr className="font-bold border-t border-slate-200">
                                          <td className="py-2 text-slate-900">Total Monthly Costs</td>
                                          <td className="py-2 text-right text-red-600">-{formatCurrency(result.personalCostsTotal)}</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                          <div className="w-1/2 bg-green-50 rounded p-4 flex flex-col justify-center items-center text-center border border-green-100">
                              <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Disposable Income (Monthly)</p>
                              <p className="text-3xl font-extrabold text-green-600">{formatCurrency(result.disposableMonthly)}</p>
                              <p className="text-xs text-green-700 mt-2 font-medium">
                                  You keep <span className="font-bold">{((result.disposableMonthly/result.grossMonthly)*100).toFixed(1)}%</span> of your gross pay after taxes & living costs.
                              </p>
                          </div>
                      </div>
                  </div>
              )}

              {/* Footer */}
              <div className="text-xs text-slate-400 mt-auto border-t pt-4">
                  <div className="flex justify-between">
                      <p>Generated by Global Net Pay Calculator</p>
                      <p>Tax Data Sources: {currentRules.sources.map(s => s.label).join(', ')}</p>
                  </div>
                  <p className="mt-2 italic">Disclaimer: This document is a simulation based on statutory tax rules for {currentRules.name}. It does not constitute official financial or legal advice.</p>
              </div>
          </div>
      )}

      <GeminiAssistant country={inputs.country} countryName={currentRules.name} />
    </div>
  );
};

export default App;
