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
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#F1F5F9" strokeWidth="6" />
                    
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
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wide">Net</span>
                    <span className="text-xl font-extrabold tracking-tight">{((result.netAnnual / gross) * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Tax</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Costs</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Free</span>
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
    details: { age: 30, maritalStatus: 'single', churchTax: false }
  });

  const [mode, setMode] = useState<CalcMode>('gross');
  const [targetNet, setTargetNet] = useState<number>(40000);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

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

        if (c && COUNTRY_RULES[c]) {
            setInputs(prev => ({
                ...prev,
                country: c,
                grossIncome: g,
                frequency: f || 'annual',
                costs: { ...prev.costs, rent, groceries, utilities, transport, insurance, emergencyFund, debt, freedomFund }
            }));
        }
    }
  }, []);

  useEffect(() => {
    let incomeToUse = inputs.grossIncome;
    if (mode === 'net') {
        incomeToUse = calculateGrossFromNet(targetNet, { ...inputs, grossIncome: 0 });
    }
    const finalInputs = { ...inputs, grossIncome: incomeToUse };
    const res = calculateNetPay(finalInputs);
    setResult(res);
  }, [inputs, mode, targetNet]);

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

  const downloadPDF = async () => {
    const element = document.getElementById('results-panel');
    if (!element || !window.jspdf || !window.html2canvas) {
        alert("PDF library loading... please try again in a second.");
        return;
    }

    try {
        document.body.style.cursor = 'wait';
        const canvas = await window.html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            windowWidth: 1200, 
            backgroundColor: '#F5F5F7' // Matches the new background
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`Salary_Calculation_${inputs.country}.pdf`);
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
    { key: 'freedomFund', label: 'Freedom Fund' }
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
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg text-yellow-400">
                    <i className="fas fa-coins text-sm"></i>
                </div>
                <h1 className="text-lg font-bold tracking-tight">Global Net Pay</h1>
            </div>
            <div className="flex gap-3">
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
             <div className="mb-8 bg-white border border-orange-100 p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2">
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
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 md:p-8 pb-10 relative text-white">
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
                            <select 
                                className="w-full p-4 pr-10 bg-[#F2F2F7] border-none rounded-2xl appearance-none text-[15px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none text-slate-900 cursor-pointer"
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold z-10 transition-colors group-focus-within:text-indigo-500">
                                {currentRules.currencySymbol}
                            </span>
                            <input 
                                type="number" 
                                min="0"
                                className={`w-full p-4 pl-10 pr-32 bg-[#F2F2F7] border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 ${mode === 'net' ? 'focus:ring-green-500/20' : 'focus:ring-indigo-500/20'} outline-none transition-all font-extrabold text-xl tracking-tight`}
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

                    {/* Detailed Inputs Group */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Age</label>
                             <input 
                                type="number" 
                                min="15" max="99"
                                className="w-full p-3 bg-[#F2F2F7] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-center font-bold"
                                value={inputs.details.age}
                                onChange={(e) => setInputs({...inputs, details: { ...inputs.details, age: parseInt(e.target.value) || 30 }})}
                            />
                        </div>
                        {currentRules.hasMaritalStatusOption && (
                             <div>
                                <label className="block text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2 pl-1">Status</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-3 bg-[#F2F2F7] border-none rounded-2xl appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-center font-bold text-sm"
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
                                <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-indigo-500 transition-colors"></div>
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
                                <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 ml-1">{field.label}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 text-xs font-bold">{currentRules.currencySymbol}</span>
                                    </div>
                                    <input 
                                        type="number"
                                        className="w-full p-2.5 pl-7 bg-[#F2F2F7] border-none rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-bold text-sm"
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
                    {/* Hero Card (Gross) - Redesigned */}
                    <div className="bg-gradient-to-br from-[#2c2c2e] to-[#1c1c1e] p-6 md:p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden group border border-white/10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="absolute -right-6 -bottom-6 text-white/5 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            <div className="text-yellow-500/20">
                                <i className="fas fa-coins"></i>
                            </div>
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                        <i className="fas fa-briefcase text-white/90"></i>
                                    </div>
                                    <p className="text-white/70 text-[13px] font-bold uppercase tracking-wider">
                                        {mode === 'net' ? 'Required Gross Annual' : 'Gross Annual Income'}
                                    </p>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
                                    {formatCurrency(result.grossAnnual)}
                                </h2>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                 <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5 shadow-inner">
                                     <span className="text-white/60 text-xs font-semibold uppercase">Monthly</span>
                                     <span className="text-xl font-bold tracking-tight text-white">{formatCurrency(result.grossMonthly)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Net Pay Card - Gradient Redesign */}
                        <div className="bg-gradient-to-br from-[#007AFF] to-[#0055ff] p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden group border border-white/10 flex flex-col h-full transition-all duration-300 hover:shadow-2xl">
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
                                    <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none break-words">
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

                        {/* Disposable Card - Gradient Redesign */}
                        <div className="bg-gradient-to-br from-[#34C759] to-[#2a9d48] p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden group border border-white/10 flex flex-col h-full transition-all duration-300 hover:shadow-2xl">
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
                                    <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none break-words">
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
                        
                        {/* Chart Card - Light Theme Redesign */}
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
                             <button onClick={downloadPDF} className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-colors backdrop-blur-md">
                                <i className="fas fa-arrow-down-to-line"></i> Export PDF
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
      <GeminiAssistant country={inputs.country} countryName={currentRules.name} />
    </div>
  );
};

export default App;