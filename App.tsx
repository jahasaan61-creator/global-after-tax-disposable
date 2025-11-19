import React, { useState, useEffect, useMemo } from 'react';
import { CountryCode, UserInputs, CalculationResult } from './types';
import { COUNTRY_RULES } from './constants';
import { calculateNetPay } from './services/taxService';
import { GeminiAssistant } from './components/GeminiAssistant';

// Declare jsPDF and html2canvas on Window interface
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const App: React.FC = () => {
  const [inputs, setInputs] = useState<UserInputs>({
    grossIncome: 50000,
    frequency: 'annual',
    country: CountryCode.USA,
    costs: { rent: 0, groceries: 0, utilities: 0, transport: 0 }
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showSources, setShowSources] = useState(false);

  const currentRules = COUNTRY_RULES[inputs.country];

  // Calculate on input change
  useEffect(() => {
    const res = calculateNetPay(inputs);
    setResult(res);
  }, [inputs]);

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
        const canvas = await window.html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Salary_Calculation_${inputs.country}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <i className="fas fa-wallet text-green-400"></i>
                    Global Net Pay
                </h1>
                <p className="text-slate-400 text-sm mt-1">Accurate Take-Home Calculator & Tax Estimator</p>
            </div>
            <button 
                onClick={() => setShowSources(!showSources)}
                className="text-xs md:text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded border border-slate-700 transition"
            >
                <i className="fas fa-book mr-2"></i> Sources
            </button>
        </div>
      </header>

      {/* Main Content */}
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
                
                {/* Country */}
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

                {/* Sub-region (if applicable) */}
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

                {/* Gross Income */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Gross Income</label>
                    <div className="flex shadow-sm rounded-lg">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-600 font-bold text-sm">
                            {currentRules.currencySymbol}
                        </span>
                        <input 
                            type="number" 
                            min="0"
                            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-r-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-semibold text-lg"
                            value={inputs.grossIncome}
                            onChange={(e) => setInputs({...inputs, grossIncome: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                </div>

                 {/* Frequency */}
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
                    {Object.keys(inputs.costs).map((key) => (
                        <div key={key}>
                            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2 ml-1">{key}</label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 font-bold text-sm">{currentRules.currencySymbol}</span>
                                </div>
                                <input 
                                    type="number"
                                    className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm"
                                    value={(inputs.costs as any)[key] || ''}
                                    placeholder="0"
                                    onChange={(e) => handleCostChange(key as any, e.target.value)}
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
                    
                    {/* Gross Annual Summary Banner */}
                    <div className="bg-slate-800 text-white p-4 md:p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-4 mb-2 md:mb-0">
                             <div className="bg-slate-700 p-3 rounded-full">
                                 <i className="fas fa-coins text-yellow-400 text-xl"></i>
                             </div>
                             <div>
                                 <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Gross Annual Income</p>
                                 <h2 className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(result.grossAnnual)}</h2>
                             </div>
                        </div>
                         <div className="text-right border-t md:border-t-0 md:border-l border-slate-700 pt-2 md:pt-0 md:pl-6 w-full md:w-auto flex md:block justify-between">
                             <p className="text-slate-400 text-sm">Monthly Gross</p>
                             <p className="text-lg font-semibold text-slate-200">{formatCurrency(result.grossMonthly)}</p>
                        </div>
                    </div>

                    {/* Hero Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                             <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Total Deductions</p>
                                <h3 className="text-2xl font-bold text-red-500">-{formatCurrency(result.totalDeductionsMonthly)}</h3>
                            </div>
                            <p className="text-slate-400 text-xs mt-2">{(result.totalDeductionsMonthly / result.grossMonthly * 100).toFixed(1)}% effective tax rate</p>
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

                    {/* Detailed Breakdown */}
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
                                            <td className="px-4 py-3">
                                                {d.name} 
                                                {d.isEmployer && <span className="ml-2 text-xs bg-slate-200 px-1.5 py-0.5 rounded not-italic">Employer Paid</span>}
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