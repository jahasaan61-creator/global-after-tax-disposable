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
    const net = Math.max(0, result.netAnnual - costs);
    
    const taxPct = (tax / gross) * 100;
    const costsPct = (costs / gross) * 100;
    const netPct = (net / gross) * 100;
    
    const r = 15.9155;
    const taxOffset = 25; 
    const netOffset = 100 - taxPct + 25;
    const costsOffset = 100 - taxPct - netPct + 25;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 42 42" className="w-full h-full">
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#e2e8f0" strokeWidth="5" />
                    {taxPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#ef4444" strokeWidth="5" 
                        strokeDasharray={`${taxPct} ${100 - taxPct}`} strokeDashoffset={taxOffset} />
                    )}
                    {netPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#10b981" strokeWidth="5"
                        strokeDasharray={`${netPct} ${100 - netPct}`} strokeDashoffset={netOffset} />
                    )}
                    {costsPct > 0 && (
                    <circle cx="21" cy="21" r={r} fill="transparent" stroke="#3b82f6" strokeWidth="5"
                        strokeDasharray={`${costsPct} ${100 - costsPct}`} strokeDashoffset={costsOffset} />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                    <span className="text-xs text-slate-400 font-medium">Take Home</span>
                    <span className="text-xl font-bold">{((result.netAnnual / gross) * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div className="flex gap-4 mt-4 text-xs">
                 <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Tax</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Costs</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span>Disposable</span>
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
    costs: { rent: 0, groceries: 0, utilities: 0, transport: 0, insurance: 0, emergencyFund: 0 },
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

        if (c && COUNTRY_RULES[c]) {
            setInputs(prev => ({
                ...prev,
                country: c,
                grossIncome: g,
                frequency: f || 'annual',
                costs: { ...prev.costs, rent, groceries, utilities, transport, insurance, emergencyFund }
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
        // Visual feedback
        document.body.style.cursor = 'wait';

        // Capture with optimized settings
        // windowWidth: 1200 forces the layout to be rendered as if on a desktop screen (side-by-side columns)
        // backgroundColor: '#ffffff' ensures transparent gaps between cards are white
        const canvas = await window.html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            windowWidth: 1200, 
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
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
      // Use origin + pathname to ensure a clean URL base (stripping old params/hash)
      const baseUrl = window.location.origin + window.location.pathname;
      const url = new URL(baseUrl);
      
      url.searchParams.set('country', inputs.country);
      
      // Always share the Annualized Gross to ensure consistency
      const grossToShare = result ? result.grossAnnual : 0;

      url.searchParams.set('gross', grossToShare.toString());
      url.searchParams.set('frequency', 'annual'); 
      
      // Share all costs
      url.searchParams.set('rent', inputs.costs.rent.toString());
      url.searchParams.set('groceries', inputs.costs.groceries.toString());
      url.searchParams.set('utilities', inputs.costs.utilities.toString());
      url.searchParams.set('transport', inputs.costs.transport.toString());
      url.searchParams.set('insurance', inputs.costs.insurance.toString());
      url.searchParams.set('emergencyFund', inputs.costs.emergencyFund.toString());
      
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
    { key: 'emergencyFund', label: 'Emergency Fund' }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <i className="fas fa-wallet text-green-400"></i>
                    Global Net Pay
                </h1>
                <p className="text-slate-400 text-sm mt-1">Accurate Take-Home Calculator & Tax Estimator</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={shareLink}
                    className="text-xs md:text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded border border-blue-500 transition flex items-center gap-2"
                >
                    {copyFeedback ? <i className="fas fa-check"></i> : <i className="fas fa-link"></i>}
                    {copyFeedback ? 'Copied!' : 'Share'}
                </button>
                <button 
                    onClick={() => setShowSources(!showSources)}
                    className="text-xs md:text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded border border-slate-700 transition"
                >
                    <i className="fas fa-book mr-2"></i> Sources
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {showSources && (
             <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm animate-fade-in">
                <h3 className="font-bold text-yellow-800 mb-2">Data Sources & Disclaimers</h3>
                <p className="text-sm text-yellow-800 mb-3">
                    This tool provides estimates based on 2024/2025 statutory rules. It is not legal or financial advice.
                </p>
                <ul className="text-sm space-y-1">
                    {currentRules.sources.map((s, i) => (
                        <li key={i}>
                            <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                <i className="fas fa-external-link-alt text-xs mr-1"></i> {s.label} ({s.date})
                            </a>
                        </li>
                    ))}
                </ul>
             </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-4 text-slate-700 border-b pb-2">1. Income Details</h2>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Country</label>
                    <div className="relative">
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={inputs.country}
                            onChange={(e) => setInputs({...inputs, country: e.target.value as CountryCode, subRegion: undefined })}
                        >
                            {Object.values(COUNTRY_RULES).map(c => (
                                <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <i className="fas fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>

                {/* Dynamic Inputs for Accuracy (Marital Status, Age, etc.) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Age</label>
                         <input 
                            type="number" 
                            min="15" max="99"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={inputs.details.age}
                            onChange={(e) => setInputs({...inputs, details: { ...inputs.details, age: parseInt(e.target.value) || 30 }})}
                        />
                    </div>
                    {currentRules.hasMaritalStatusOption && (
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status</label>
                            <select 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={inputs.details.maritalStatus}
                                onChange={(e) => setInputs({...inputs, details: { ...inputs.details, maritalStatus: e.target.value as 'single'|'married' }})}
                            >
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                            </select>
                        </div>
                    )}
                </div>

                {currentRules.hasChurchTaxOption && (
                     <div className="mb-4 flex items-center gap-3 bg-slate-50 p-3 rounded border border-slate-100">
                        <input 
                            type="checkbox" 
                            id="churchTax"
                            checked={inputs.details.churchTax}
                            onChange={(e) => setInputs({...inputs, details: { ...inputs.details, churchTax: e.target.checked }})}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="churchTax" className="text-sm text-slate-700 select-none">Pay Church Tax? (Kirchensteuer)</label>
                     </div>
                )}

                {currentRules.subNationalRules && (
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-600 mb-1">{currentRules.subNationalLabel}</label>
                        <div className="relative">
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={inputs.subRegion || ''}
                                onChange={(e) => setInputs({...inputs, subRegion: e.target.value })}
                            >
                                <option value="">Select {currentRules.subNationalLabel}...</option>
                                {currentRules.subNationalRules.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-4 p-1 bg-slate-100 rounded-lg flex relative">
                    <button 
                        onClick={() => setMode('gross')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all z-10 ${mode === 'gross' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        From Gross
                    </button>
                    <button 
                        onClick={() => setMode('net')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all z-10 ${mode === 'net' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
                    >
                        From Net
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {mode === 'gross' ? 'Gross Income' : 'Desired Net Income'}
                        {mode === 'net' && <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Reverse Active</span>}
                    </label>
                    <div className={`flex shadow-sm rounded-lg ${mode === 'net' ? 'ring-2 ring-emerald-100' : ''}`}>
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-600 font-bold text-sm">
                            {currentRules.currencySymbol}
                        </span>
                        <input 
                            type="number" 
                            min="0"
                            className="w-full p-4 bg-white border border-slate-300 rounded-r-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-bold text-xl tracking-tight"
                            value={mode === 'gross' ? inputs.grossIncome : targetNet}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (mode === 'gross') {
                                    setInputs({...inputs, grossIncome: val});
                                } else {
                                    setTargetNet(val);
                                }
                            }}
                        />
                    </div>
                </div>

                 <div className="mb-4">
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setInputs({...inputs, frequency: 'annual'})}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${inputs.frequency === 'annual' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                        >
                            Annual
                        </button>
                        <button 
                             onClick={() => setInputs({...inputs, frequency: 'monthly'})}
                             className={`flex-1 py-2 text-sm font-medium rounded-md transition ${inputs.frequency === 'monthly' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                        >
                            Monthly
                        </button>
                     </div>
                 </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-6 text-slate-700 border-b pb-2 flex items-center gap-2">
                    <i className="fas fa-shopping-cart text-slate-400"></i>
                    2. Monthly Living Costs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {costFields.map((field) => (
                        <div key={field.key}>
                            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2 ml-1">{field.label}</label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 font-bold text-sm">{currentRules.currencySymbol}</span>
                                </div>
                                <input 
                                    type="number"
                                    className="w-full p-3 pl-8 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-semibold text-base"
                                    value={(inputs.costs as any)[field.key] || ''}
                                    placeholder="0"
                                    onChange={(e) => handleCostChange(field.key as any, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t flex justify-between items-center text-slate-600">
                    <span className="text-sm font-medium">Total Costs:</span>
                    <span className="font-bold text-red-500">-{formatCurrency(result ? result.personalCostsTotal : 0)}</span>
                </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8" id="results-panel">
             {result && (
                 <div className="space-y-6">
                    
                    <div className="bg-slate-800 text-white p-4 md:p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-4 mb-2 md:mb-0">
                             <div className="bg-slate-700 p-3 rounded-full">
                                 <i className="fas fa-coins text-yellow-400 text-xl"></i>
                             </div>
                             <div>
                                 <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">
                                    {mode === 'net' ? 'Required Gross Annual' : 'Gross Annual Income'}
                                 </p>
                                 <h2 className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(result.grossAnnual)}</h2>
                             </div>
                        </div>
                         <div className="text-right border-t md:border-t-0 md:border-l border-slate-700 pt-2 md:pt-0 md:pl-6 w-full md:w-auto flex md:block justify-between">
                             <p className="text-slate-400 text-sm">Monthly Gross</p>
                             <p className="text-lg font-semibold text-slate-200">{formatCurrency(result.grossMonthly)}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                         <div className="flex-1 grid grid-cols-1 gap-4">
                            <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <i className="fas fa-money-bill-wave text-6xl"></i>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm font-medium mb-1">Net Monthly Pay</p>
                                    <h3 className="text-3xl md:text-4xl font-bold">{formatCurrency(result.netMonthly)}</h3>
                                </div>
                                <p className="text-blue-200 text-xs mt-2">Annual: {formatCurrency(result.netAnnual)}</p>
                            </div>

                            <div className="bg-emerald-500 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <i className="fas fa-piggy-bank text-6xl"></i>
                                </div>
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium mb-1">Disposable Income</p>
                                    <h3 className="text-3xl font-bold">{formatCurrency(result.disposableMonthly)}</h3>
                                </div>
                                <p className="text-emerald-100 text-xs mt-2">
                                    Annual: {formatCurrency(result.disposableMonthly * 12)}
                                </p>
                            </div>
                         </div>

                         <div className="md:w-72 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                            <DonutChart result={result} />
                         </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700">Detailed Breakdown</h3>
                            <button onClick={downloadPDF} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2">
                                <i className="fas fa-file-pdf"></i> Download PDF
                            </button>
                        </div>
                        <div className="p-6">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3 text-right">Annual</th>
                                        <th className="px-4 py-3 text-right">Monthly</th>
                                        <th className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">% Gross</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="font-semibold text-slate-900 bg-slate-50/50">
                                        <td className="px-4 py-3">Gross Income</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(result.grossAnnual)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(result.grossMonthly)}</td>
                                        <td className="px-4 py-3 text-right hidden sm:table-cell">100%</td>
                                    </tr>
                                    {result.deductionsBreakdown.map((d, idx) => (
                                        <tr key={idx} className={d.isEmployer ? 'text-slate-400 italic' : 'text-red-600'}>
                                            <td className="px-4 py-3 flex items-center group">
                                                {d.name} 
                                                {d.isEmployer && <span className="ml-2 text-xs bg-slate-200 px-1.5 py-0.5 rounded not-italic">Employer Paid</span>}
                                                {d.description && (
                                                    <div className="relative ml-2">
                                                        <i className="fas fa-info-circle text-slate-300 hover:text-blue-400 cursor-help"></i>
                                                        <div className="absolute left-0 bottom-6 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg hidden group-hover:block z-10">
                                                            {d.description}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">-{formatCurrency(d.amount)}</td>
                                            <td className="px-4 py-3 text-right">-{formatCurrency(d.amount / 12)}</td>
                                            <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">
                                                {(d.amount / result.grossAnnual * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold text-slate-900 bg-blue-50/50 border-t-2 border-slate-200">
                                        <td className="px-4 py-3">Net Income</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(result.netAnnual)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(result.netMonthly)}</td>
                                        <td className="px-4 py-3 text-right hidden sm:table-cell">{(result.netAnnual / result.grossAnnual * 100).toFixed(1)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="text-center text-xs text-slate-400 pb-8">
                        Calculated based on {currentRules.name} tax rules. <br/>
                        See "Sources" for details. Values are estimates.
                    </div>
                 </div>
             )}
          </div>
        </div>
      </main>
      <GeminiAssistant country={inputs.country} countryName={currentRules.name} />
    </div>
  );
};

export default App;