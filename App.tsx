
import React, { useState, useEffect, useRef } from 'react';
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

const DonutChart: React.FC<{ result: CalculationResult }> = ({ result }) => {
    const gross = result.grossAnnual;
    const tax = result.totalDeductionsMonthly * 12;
    const costs = result.personalCostsTotal * 12;
    const disposable = Math.max(0, result.netAnnual - costs);
    
    const taxPct = (tax / gross) * 100;
    const costsPct = (costs / gross) * 100;
    const dispPct = (disposable / gross) * 100;
    
    const r = 15.9155;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 origin-center">
                    {/* Track */}
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#E5E7EB" strokeWidth="6" />
                    
                    {/* Tax (Red) - Starts at 0 */}
                    {taxPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#FF3B30" strokeWidth="6" 
                        strokeDasharray={`${taxPct} ${100 - taxPct}`} strokeDashoffset={0} strokeLinecap="round" />
                    )}
                    
                    {/* Costs (Blue) - Starts after Tax */}
                    {costsPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#007AFF" strokeWidth="6"
                        strokeDasharray={`${costsPct} ${100 - costsPct}`} strokeDashoffset={-taxPct} strokeLinecap="round" />
                    )}

                    {/* Disposable (Green) - Starts after Tax + Costs */}
                    {dispPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#34C759" strokeWidth="6"
                        strokeDasharray={`${dispPct} ${100 - dispPct}`} strokeDashoffset={-(taxPct + costsPct)} strokeLinecap="round" />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900">
                    <span className="text-xl font-extrabold tracking-tight">{((result.netAnnual / gross) * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Tax</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Costs</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Free</span>
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
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<CountryCode>(CountryCode.USA);
  const [toCurrency, setToCurrency] = useState<CountryCode>(CountryCode.DEU);
  const [convertedResult, setConvertedResult] = useState<number>(0);

  const currentRules = COUNTRY_RULES[inputs.country];

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
                setInputs(prev => ({ ...prev, ...parsed }));
            } catch (e) {}
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gnp_inputs', JSON.stringify(inputs));
    
    let incomeToUse = inputs.grossIncome;
    if (mode === 'net') {
        incomeToUse = calculateGrossFromNet(targetNet, { ...inputs, grossIncome: 0 });
    }
    const finalInputs = { ...inputs, grossIncome: incomeToUse };
    const res = calculateNetPay(finalInputs);
    setResult(res);
  }, [inputs, mode, targetNet]);

  // Converter Logic
  useEffect(() => {
      const fromRate = COUNTRY_RULES[fromCurrency].exchangeRatePerUSD;
      const toRate = COUNTRY_RULES[toCurrency].exchangeRatePerUSD;
      if (fromRate && toRate) {
          // Convert to USD first, then to Target
          const amountInUSD = convertAmount / fromRate;
          const finalAmount = amountInUSD * toRate;
          setConvertedResult(finalAmount);
      }
  }, [convertAmount, fromCurrency, toCurrency]);

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

  const getFlagUrl = (code: CountryCode) => {
    const map: Record<string, string> = {
        [CountryCode.USA]: 'us', [CountryCode.CHE]: 'ch', [CountryCode.CAN]: 'ca',
        [CountryCode.DEU]: 'de', [CountryCode.IRL]: 'ie', [CountryCode.NZL]: 'nz',
        [CountryCode.NOR]: 'no', [CountryCode.SGP]: 'sg', [CountryCode.BGD]: 'bd'
    };
    return `https://flagcdn.com/w40/${map[code]}.png`;
  };

  const getHDFlagUrl = (code: CountryCode) => {
    const map: Record<string, string> = {
        [CountryCode.USA]: 'us', [CountryCode.CHE]: 'ch', [CountryCode.CAN]: 'ca',
        [CountryCode.DEU]: 'de', [CountryCode.IRL]: 'ie', [CountryCode.NZL]: 'nz',
        [CountryCode.NOR]: 'no', [CountryCode.SGP]: 'sg', [CountryCode.BGD]: 'bd'
    };
    return `https://flagcdn.com/w640/${map[code]}.png`;
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
        const fileName = `NetPay_Statement_${inputs.country}_${dateStr}.pdf`;
        
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

  // Reusable iOS-style Segmented Control
  const SegmentedControl = ({ options, value, onChange, dark }: { options: {label: string, value: string}[], value: string, onChange: (v: any) => void, dark?: boolean }) => (
    <div className={`${dark ? 'bg-black/20' : 'bg-slate-200/80'} p-1 rounded-[14px] flex relative select-none cursor-pointer shadow-inner`}>
        {options.map((opt) => (
            <button 
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-2 px-3 text-sm font-extrabold rounded-[10px] transition-all duration-200 active:scale-95 ${
                    value === opt.value 
                        ? (dark ? 'bg-white/90 text-slate-900' : 'bg-white text-black') + ' shadow-[0_2px_8px_rgba(0,0,0,0.12)] transform scale-[1.02]' 
                        : (dark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#1d1d1f] bg-[#F5F5F7]">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg text-yellow-400 overflow-hidden border-2 border-white/20">
                    <i className="fas fa-coins text-2xl"></i>
                </div>
                <h1 className="text-xl font-bold tracking-tight hidden sm:block">Global Net Pay</h1>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => {
                        setInputs({
                            grossIncome: 50000,
                            frequency: 'annual',
                            country: CountryCode.USA,
                            costs: { rent: 0, groceries: 0, utilities: 0, transport: 0, insurance: 0, emergencyFund: 0, debt: 0, freedomFund: 0 },
                            details: { age: 30, maritalStatus: 'single', churchTax: false },
                            annualBonus: 0
                        });
                        setMode('gross');
                    }}
                    className="h-8 px-4 rounded-full bg-white border border-gray-200/60 text-[13px] font-semibold text-slate-700 hover:bg-gray-50 transition shadow-sm flex items-center gap-2 active:scale-95 duration-150"
                >
                    <i className="fas fa-redo-alt text-slate-400"></i>
                    Reset
                </button>
                <button 
                    onClick={shareLink}
                    className="h-8 px-4 rounded-full bg-white border border-gray-200/60 text-[13px] font-semibold text-slate-700 hover:bg-gray-50 transition shadow-sm flex items-center gap-2 active:scale-95 duration-150"
                >
                    {copyFeedback ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-share-square text-blue-500"></i>}
                    {copyFeedback ? 'Copied' : 'Share'}
                </button>
                <button 
                    onClick={() => setShowSources(!showSources)}
                    className="h-8 w-8 rounded-full bg-white border border-gray-200/60 flex items-center justify-center hover:bg-gray-50 transition shadow-sm active:scale-95 duration-150"
                    title="Sources"
                >
                    <i className="fas fa-info text-slate-500 text-xs"></i>
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {showSources && (
             <div className="mb-8 bg-white border border-orange-100 p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-2 mb-3 text-orange-600">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3 className="font-bold text-sm">Data Sources & Disclaimers</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4 font-medium">
                    This tool provides estimates based on 2024/2025 statutory rules. It is not legal or financial advice.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {currentRules.sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline bg-blue-50/50 p-2 rounded-lg font-medium">
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
            <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden transition-all duration-300 hover:shadow-2xl">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-[#0034b8] to-[#0c58fa] p-6 md:p-8 pb-10 relative text-white">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                     <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                <i className="fas fa-sack-dollar text-white"></i>
                            </div>
                            <h2 className="text-xl font-extrabold tracking-tight">Income</h2>
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

                <div className="p-6 md:p-8 -mt-4 bg-white rounded-t-[32px] relative z-20 space-y-5">
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Where do you live?</label>
                        <div className="relative">
                            <img 
                                src={getFlagUrl(inputs.country)} 
                                alt="flag" 
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full object-cover shadow-sm z-10 contrast-125 saturate-150"
                                crossOrigin="anonymous"
                            />
                            <select 
                                className="w-full p-4 pl-14 pr-10 bg-[#F2F2F7] border-none rounded-2xl appearance-none text-[15px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none text-slate-900 cursor-pointer"
                                value={inputs.country}
                                onChange={(e) => setInputs({...inputs, country: e.target.value as CountryCode, subRegion: undefined })}
                            >
                                {Object.values(COUNTRY_RULES).map(c => (
                                    <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>

                    {currentRules.subNationalRules && (
                        <div>
                             <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">{currentRules.subNationalLabel}</label>
                             <div className="relative">
                                <select 
                                    className="w-full p-4 pr-10 bg-[#F2F2F7] border-none rounded-2xl appearance-none text-[15px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none text-slate-900 cursor-pointer"
                                    value={inputs.subRegion || ''}
                                    onChange={(e) => setInputs({...inputs, subRegion: e.target.value })}
                                >
                                    <option value="">Select {currentRules.subNationalLabel}...</option>
                                    {currentRules.subNationalRules.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                    <i className="fas fa-chevron-down text-xs"></i>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">
                            {mode === 'gross' ? 'Gross Income' : 'Desired Net Income'}
                        </label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold z-10 transition-colors group-focus-within:text-blue-500">
                                {currentRules.currencySymbol}
                            </span>
                            <input 
                                type="number" 
                                min="0"
                                autoComplete="off"
                                className={`w-full p-4 pl-10 pr-32 bg-[#F2F2F7] border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 ${mode === 'net' ? 'focus:ring-green-500/20' : 'focus:ring-blue-500/20'} outline-none transition-all font-extrabold text-xl tracking-tight`}
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
                    </div>

                    {/* Annual Bonus Input */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Annual Bonus / 13th Month</label>
                        <div className="relative group">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold z-10 transition-colors group-focus-within:text-blue-500">
                                {currentRules.currencySymbol}
                            </span>
                            <input 
                                type="number" 
                                min="0"
                                autoComplete="off"
                                placeholder="0"
                                className="w-full p-4 pl-10 bg-[#F2F2F7] border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-lg"
                                value={inputs.annualBonus || ''}
                                onChange={(e) => setInputs({...inputs, annualBonus: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                    </div>

                    {/* Detailed Inputs Group */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Age</label>
                             <input 
                                type="number" 
                                min="15" max="99"
                                autoComplete="off"
                                className="w-full p-3 bg-[#F2F2F7] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-center font-bold"
                                value={inputs.details.age}
                                onChange={(e) => setInputs({...inputs, details: { ...inputs.details, age: parseInt(e.target.value) || 30 }})}
                            />
                        </div>
                        {currentRules.hasMaritalStatusOption && (
                             <div>
                                <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Status</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-3 bg-[#F2F2F7] border-none rounded-2xl appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-center font-bold text-sm"
                                        value={inputs.details.maritalStatus}
                                        onChange={(e) => setInputs({...inputs, details: { ...inputs.details, maritalStatus: e.target.value as 'single'|'married' }})}
                                    >
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {currentRules.hasChurchTaxOption && (
                         <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-2xl">
                            <label htmlFor="churchTax" className="text-sm font-bold text-slate-700">Church Tax</label>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="churchTax"
                                    className="peer sr-only"
                                    checked={inputs.details.churchTax}
                                    onChange={(e) => setInputs({...inputs, details: { ...inputs.details, churchTax: e.target.checked }})}
                                />
                                <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Costs Section */}
            <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden transition-all duration-300 hover:shadow-2xl">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 md:p-8 pb-10 relative text-white">
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

                <div className="p-6 md:p-8 -mt-4 bg-white rounded-t-[32px] relative z-20">
                    <div className="grid grid-cols-2 gap-4">
                        {costFields.map((field) => (
                            <div key={field.key} className="relative">
                                <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 ml-1 whitespace-nowrap">{field.label}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 text-xs font-bold">{currentRules.currencySymbol}</span>
                                    </div>
                                    <input 
                                        type="number"
                                        autoComplete="off"
                                        className="w-full p-2.5 pl-7 bg-[#F2F2F7] border-none rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-sm"
                                        value={(inputs.costs as any)[field.key] || ''}
                                        placeholder="0"
                                        onChange={(e) => handleCostChange(field.key as any, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {result && result.personalCostsTotal > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[13px] font-bold text-slate-500">Total Monthly Costs</span>
                            <span className="text-[15px] font-extrabold text-[#FF3B30]">-{formatCurrency(result.personalCostsTotal)}</span>
                        </div>
                    )}
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
                                className="w-full h-full object-cover contrast-125 saturate-150 brightness-90"
                             />
                             {/* Cinematic Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/80 mix-blend-multiply"></div>
                             <div className="absolute inset-0 bg-black/30"></div>
                             
                             {/* Moving Sheen/Shimmer */}
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                        </div>

                        {/* Content Layer - RESIZED and REALIGNED */}
                        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110">
                                        <i className="fas fa-briefcase text-xl text-white drop-shadow-md"></i>
                                    </div>
                                    <p className="text-white/90 text-base md:text-lg font-bold uppercase tracking-wider shadow-black drop-shadow-md">
                                        {mode === 'net' ? 'Required Gross Annual' : 'Gross Annual Income'}
                                    </p>
                                </div>
                                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl mt-2 leading-none">
                                    {formatCurrency(result.grossAnnual)}
                                </h2>
                            </div>
                            
                            {/* Enlarged Monthly Button */}
                            <div className="flex flex-col items-end gap-2 pb-1">
                                 <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:bg-white/20 group-hover:translate-x-[-5px]">
                                     <span className="text-white/90 text-xs font-extrabold uppercase tracking-wide drop-shadow-sm">Monthly</span>
                                     <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">{formatCurrency(result.grossMonthly)}</span>
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
                        <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white text-slate-900 relative overflow-hidden group flex flex-col justify-between h-full transition-all duration-300 hover:shadow-2xl">
                             <div className="absolute -right-8 -bottom-8 text-slate-50 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <i className="fas fa-chart-pie"></i>
                             </div>
                             <div className="relative z-10 w-full h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                     <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-50">
                                        <i className="fas fa-chart-pie text-lg text-slate-900"></i>
                                     </div>
                                     <p className="text-slate-500 text-[13px] font-bold uppercase tracking-wider">Tax / Cost Ratio</p>
                                </div>
                                <div className="flex-grow flex items-center justify-center mt-2">
                                    <DonutChart result={result} />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Quick Convert Horizontal Card */}
                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden transition-all duration-300 hover:shadow-2xl">
                         <div className="bg-gradient-to-r from-[#2FB050] to-[#A0E870] p-5 relative flex items-center justify-between text-white">
                             <div className="flex items-center gap-3 relative z-10">
                                 <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-exchange-alt text-white"></i>
                                </div>
                                <h3 className="font-extrabold text-lg tracking-tight text-white">Quick Convert</h3>
                             </div>
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                         </div>
                         <div className="p-6 flex flex-col md:flex-row items-center gap-4">
                             <div className="flex-1 w-full">
                                 <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Amount</label>
                                 <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 text-xs font-bold">{COUNTRY_RULES[fromCurrency].currencySymbol}</span>
                                    </div>
                                    <input 
                                        type="number"
                                        value={convertAmount}
                                        onChange={(e) => setConvertAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full p-3 pl-8 bg-[#F2F2F7] border-none rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#e6ca29]/20 outline-none transition-all font-bold text-lg"
                                    />
                                 </div>
                             </div>
                             <div className="flex-1 w-full">
                                 <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">From</label>
                                 <div className="relative">
                                    <img 
                                        src={getFlagUrl(fromCurrency)} 
                                        alt="flag" 
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full object-cover shadow-sm contrast-125 saturate-150"
                                        crossOrigin="anonymous"
                                    />
                                    <select 
                                        value={fromCurrency}
                                        onChange={(e) => setFromCurrency(e.target.value as CountryCode)}
                                        className="w-full p-3 pl-12 bg-[#F2F2F7] border-none rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#e6ca29]/20 outline-none transition-all font-bold text-sm cursor-pointer appearance-none"
                                    >
                                        {Object.values(COUNTRY_RULES).map(c => (
                                            <option key={c.code} value={c.code}>{c.currency}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                        <i className="fas fa-chevron-down text-xs"></i>
                                    </div>
                                 </div>
                             </div>
                             <div className="flex items-center justify-center pt-6 text-[#e6ca29]">
                                 <i className="fas fa-arrow-right text-xl hidden md:block"></i>
                                 <i className="fas fa-arrow-down text-xl md:hidden"></i>
                             </div>
                             <div className="flex-1 w-full">
                                 <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">To</label>
                                 <div className="relative">
                                    <img 
                                        src={getFlagUrl(toCurrency)} 
                                        alt="flag" 
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full object-cover shadow-sm contrast-125 saturate-150"
                                        crossOrigin="anonymous"
                                    />
                                    <select 
                                        value={toCurrency}
                                        onChange={(e) => setToCurrency(e.target.value as CountryCode)}
                                        className="w-full p-3 pl-12 bg-[#F2F2F7] border-none rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#e6ca29]/20 outline-none transition-all font-bold text-sm cursor-pointer appearance-none"
                                    >
                                        {Object.values(COUNTRY_RULES).map(c => (
                                            <option key={c.code} value={c.code}>{c.currency}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                        <i className="fas fa-chevron-down text-xs"></i>
                                    </div>
                                 </div>
                             </div>
                             <div className="flex-1 w-full bg-[#A0E870]/10 rounded-2xl p-3 border border-[#A0E870]/20 text-right">
                                 <label className="block text-[10px] font-bold text-[#7ac74f] uppercase tracking-wider mb-1">Result</label>
                                 <div className="text-xl font-extrabold text-[#5a8c3e] truncate">
                                     {new Intl.NumberFormat('en-US', { style: 'currency', currency: COUNTRY_RULES[toCurrency].currency }).format(convertedResult)}
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Detailed Breakdown Table */}
                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden transition-all duration-300 hover:shadow-2xl">
                         {/* Gradient Header */}
                        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 flex justify-between items-center relative">
                             <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                             <div className="relative z-10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-list-alt text-white"></i>
                                </div>
                                <h3 className="font-extrabold text-lg text-white tracking-tight">Breakdown</h3>
                             </div>
                             <button onClick={downloadPDF} className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-colors backdrop-blur-md active:scale-95 duration-150">
                                <i className="fas fa-arrow-down-to-line"></i> Get PDF
                            </button>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-[#86868b] uppercase font-bold bg-[#F5F5F7] border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 pl-8">Item</th>
                                        <th className="px-6 py-4 text-right">Annual</th>
                                        <th className="px-6 py-4 text-right">Monthly</th>
                                        <th className="px-6 py-4 text-right hidden sm:table-cell">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <tr className="text-slate-900">
                                        <td className="px-6 py-4 pl-8 font-bold">Gross Income</td>
                                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(result.grossAnnual)}</td>
                                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(result.grossMonthly)}</td>
                                        <td className="px-6 py-4 text-right text-slate-400 font-semibold hidden sm:table-cell">100%</td>
                                    </tr>
                                    {result.deductionsBreakdown.map((d, idx) => (
                                        <tr key={idx} className={`hover:bg-gray-50 transition-colors ${d.isEmployer ? 'text-slate-400' : 'text-[#FF3B30]'}`}>
                                            <td className="px-6 py-4 pl-8 flex items-center group font-bold">
                                                <span className={d.isEmployer ? 'italic font-medium' : ''}>{d.name}</span>
                                                {d.isEmployer && <span className="ml-2 text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Employer</span>}
                                                {d.description && (
                                                    <div className="relative ml-2">
                                                        <i className="fas fa-info-circle text-gray-300 hover:text-blue-400 cursor-help transition-colors"></i>
                                                        <div className="absolute left-0 bottom-6 w-64 bg-[#1d1d1f] text-white text-xs p-3 rounded-xl shadow-xl hidden group-hover:block z-20 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
                                                            {d.description}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold">-{formatCurrency(d.amount)}</td>
                                            <td className="px-6 py-4 text-right font-bold">-{formatCurrency(d.amount / 12)}</td>
                                            <td className="px-6 py-4 text-right text-slate-400 font-semibold hidden sm:table-cell">
                                                {(d.amount / result.grossAnnual * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-[#F2F2F7] text-slate-900">
                                        <td className="px-6 py-4 pl-8 font-extrabold">Net Income</td>
                                        <td className="px-6 py-4 text-right font-extrabold">{formatCurrency(result.netAnnual)}</td>
                                        <td className="px-6 py-4 text-right font-extrabold">{formatCurrency(result.netMonthly)}</td>
                                        <td className="px-6 py-4 text-right text-slate-500 font-bold hidden sm:table-cell">
                                            {(result.netAnnual / result.grossAnnual * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="text-center pt-4 pb-8">
                         <p className="text-xs text-slate-400 font-bold">Calculations are estimates based on {currentRules.name} tax laws.</p>
                    </div>
                 </>
             )}
          </div>
        </div>
      </main>

      {/* Hidden Invoice Template for PDF Export */}
      {result && (
          <div id="pdf-invoice-template" className="fixed top-0 left-[-10000px] bg-white text-slate-900 p-12 w-[800px]">
              <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
                  <div>
                      <div className="flex items-center gap-2 mb-2">
                          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-yellow-400 border-2 border-white">
                             <i className="fas fa-coins text-2xl"></i>
                          </div>
                          <h1 className="text-3xl font-bold">Global Net Pay Calculator</h1>
                      </div>
                      <p className="text-xl text-slate-500 font-medium">Salary & Tax Estimation Statement</p>
                  </div>
                  <div className="text-right">
                      <p className="text-2xl font-bold">INVOICE / STATEMENT</p>
                      <p className="text-base text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                      <p className="text-base text-slate-500">Ref: {inputs.country}-{new Date().getFullYear()}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                  <div>
                      <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wider">Employee Details</h3>
                      <div className="space-y-2 text-base">
                          <p><span className="font-bold w-24 inline-block text-slate-700">Country:</span> {currentRules.name}</p>
                          <p><span className="font-bold w-24 inline-block text-slate-700">Age:</span> {inputs.details.age}</p>
                          <p><span className="font-bold w-24 inline-block text-slate-700">Status:</span> {inputs.details.maritalStatus}</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wider">Summary</h3>
                      <div className="text-5xl font-extrabold text-slate-900 mb-1">
                          {formatCurrency(result.grossAnnual)}
                      </div>
                      <p className="text-lg text-slate-500 font-medium">Gross Annual Income</p>
                  </div>
              </div>

              <div className="mb-8">
                  <table className="w-full text-base border-collapse">
                      <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                              <th className="py-4 px-4 text-left font-bold text-slate-700 text-lg">Description</th>
                              <th className="py-4 px-4 text-right font-bold text-slate-700 text-lg">Annual</th>
                              <th className="py-4 px-4 text-right font-bold text-slate-700 text-lg">Monthly</th>
                              <th className="py-4 px-4 text-right font-bold text-slate-700 text-lg">%</th>
                          </tr>
                      </thead>
                      <tbody>
                           <tr className="border-b border-slate-100 even:bg-slate-50">
                               <td className="py-4 px-4 font-bold">Gross Income</td>
                               <td className="py-4 px-4 text-right font-medium">{formatCurrency(result.grossAnnual)}</td>
                               <td className="py-4 px-4 text-right font-medium">{formatCurrency(result.grossMonthly)}</td>
                               <td className="py-4 px-4 text-right font-medium">100%</td>
                           </tr>
                           {inputs.annualBonus > 0 && (
                                <tr className="border-b border-slate-100 even:bg-slate-50">
                                    <td className="py-4 px-4 font-bold">Annual Bonus</td>
                                    <td className="py-4 px-4 text-right font-medium">{formatCurrency(inputs.annualBonus)}</td>
                                    <td className="py-4 px-4 text-right font-medium">-</td>
                                    <td className="py-4 px-4 text-right font-medium">-</td>
                                </tr>
                           )}
                           {result.deductionsBreakdown.map((d, i) => (
                               <tr key={i} className="border-b border-slate-100 text-red-600 even:bg-slate-50">
                                   <td className="py-4 px-4 flex items-center gap-2 font-medium">
                                       {d.name} 
                                       {d.isEmployer && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 rounded uppercase font-bold">Employer</span>}
                                   </td>
                                   <td className="py-4 px-4 text-right font-medium">-{formatCurrency(d.amount)}</td>
                                   <td className="py-4 px-4 text-right font-medium">-{formatCurrency(d.amount/12)}</td>
                                   <td className="py-4 px-4 text-right font-medium">{(d.amount/result.grossAnnual * 100).toFixed(1)}%</td>
                               </tr>
                           ))}
                           <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                               <td className="py-4 px-4 text-lg">NET INCOME</td>
                               <td className="py-4 px-4 text-right text-lg">{formatCurrency(result.netAnnual)}</td>
                               <td className="py-4 px-4 text-right text-lg">{formatCurrency(result.netMonthly)}</td>
                               <td className="py-4 px-4 text-right text-lg">{(result.netAnnual/result.grossAnnual*100).toFixed(1)}%</td>
                           </tr>
                      </tbody>
                  </table>
              </div>

              {result.personalCostsTotal > 0 && (
                  <div className="mb-8">
                      <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 border-b pb-2 tracking-wider">Personal Costs Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4 text-base">
                          {Object.entries(inputs.costs).map(([key, val]) => (val as number) > 0 && (
                              <div key={key} className="flex justify-between border-b border-dotted border-slate-200 pb-1">
                                  <span className="capitalize text-slate-600 whitespace-nowrap font-medium">{key.replace(/([A-Z])/g, ' $1').replace('freedom Fund', 'Freedom/Runway Fund').trim()}</span>
                                  <span className="font-bold">{formatCurrency(val as number)}/mo</span>
                              </div>
                          ))}
                          <div className="col-span-2 flex justify-between font-bold pt-2 text-lg">
                              <span>Total Costs (Annual)</span>
                              <span className="text-red-600">-{formatCurrency(result.personalCostsTotal * 12)}</span>
                          </div>
                      </div>
                  </div>
              )}

              <div className="bg-green-50 border border-green-100 rounded-xl p-8 flex justify-between items-center">
                   <div>
                       <p className="text-xl font-bold text-green-800 uppercase mb-1">Disposable Income (Free Cash)</p>
                       <p className="text-base text-green-600 font-medium">After Taxes & Living Costs</p>
                   </div>
                   <div className="flex gap-8 text-right">
                       <div>
                           <p className="text-4xl font-extrabold text-green-700">{formatCurrency(result.disposableMonthly * 12)}</p>
                           <p className="text-sm font-bold text-green-600 uppercase tracking-wide mt-1">Annual</p>
                       </div>
                       <div className="border-l border-green-200 pl-8">
                           <p className="text-4xl font-extrabold text-green-700">{formatCurrency(result.disposableMonthly)}</p>
                           <p className="text-sm font-bold text-green-600 uppercase tracking-wide mt-1">Monthly</p>
                       </div>
                   </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400 font-medium">
                  <p>Generated by Global Net Pay Calculator. This document is for estimation purposes only and does not constitute official financial advice.</p>
                  <p className="mt-1">Source Rules: {currentRules.sources.map(s => s.label).join(', ')}</p>
              </div>
          </div>
      )}

      <GeminiAssistant country={inputs.country} countryName={currentRules.name} />
    </div>
  );
};

export default App;
