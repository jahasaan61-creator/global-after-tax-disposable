
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
      [CountryCode.JPN]: 'jp', [CountryCode.AUS]: 'au', [CountryCode.NLD]: 'nl'
  };
  return `https://flagcdn.com/w40/${map[code] || 'us'}.png`;
};

const getHDFlagUrl = (code: CountryCode) => {
  const map: Record<string, string> = {
      [CountryCode.USA]: 'us', [CountryCode.CHE]: 'ch', [CountryCode.CAN]: 'ca',
      [CountryCode.DEU]: 'de', [CountryCode.IRL]: 'ie', [CountryCode.NZL]: 'nz',
      [CountryCode.NOR]: 'no', [CountryCode.SGP]: 'sg', [CountryCode.BGD]: 'bd',
      [CountryCode.ESP]: 'es', [CountryCode.GBR]: 'gb', [CountryCode.IND]: 'in',
      [CountryCode.JPN]: 'jp', [CountryCode.AUS]: 'au', [CountryCode.NLD]: 'nl'
  };
  return `https://flagcdn.com/w640/${map[code] || 'us'}.png`;
};

// --- COMPONENTS ---

// Custom Number Input with Redesigned Spin Buttons
interface SmartNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: number;
    onChangeValue: (val: number) => void;
    step?: number;
    min?: number;
    max?: number;
    prefix?: string;
    suffixContent?: React.ReactNode;
    containerClassName?: string;
    inputClassName?: string;
    highlight?: boolean;
}

const SmartNumberInput = ({ 
    value, 
    onChangeValue, 
    step = 1, 
    min = 0, 
    max, 
    prefix, 
    suffixContent, 
    containerClassName = "",
    inputClassName = "",
    highlight,
    ...props 
}: SmartNumberInputProps) => {
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const updateValue = (direction: 1 | -1) => {
        const current = valueRef.current;
        let next = (Number(current) || 0) + (step * direction);
        if (min !== undefined && next < min) next = min;
        if (max !== undefined && next > max) next = max;
        
        onChangeValue(next);
        valueRef.current = next;
    };

    const handleMouseDown = (direction: 1 | -1) => {
        updateValue(direction); // Immediate update
        // Delay before rapid fire
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                updateValue(direction);
            }, 50); // Rapid speed (50ms)
        }, 400); // Wait 400ms before rapid starts
    };

    const handleStop = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => handleStop();
    }, []);

    return (
        <div className={`relative group ${containerClassName} ${highlight ? 'ring-4 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] rounded-2xl' : ''}`}>
            {prefix && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-extrabold z-10 transition-colors group-focus-within:text-blue-500 pointer-events-none select-none">
                    {prefix}
                </div>
            )}
            
            <input
                type="number"
                value={value || ''}
                onChange={(e) => onChangeValue(parseFloat(e.target.value))}
                className={`${inputClassName} appearance-none`} // appearance-none handled by global CSS too, but good for safety
                min={min}
                max={max}
                {...props}
            />

            {/* Custom Spinners */}
            <div className={`absolute top-1.5 bottom-1.5 flex flex-col gap-0.5 w-6 justify-center z-20 ${suffixContent ? 'right-[124px]' : 'right-2'}`}>
                <button 
                    onMouseDown={() => handleMouseDown(1)}
                    onMouseUp={handleStop}
                    onMouseLeave={handleStop}
                    onTouchStart={() => handleMouseDown(1)}
                    onTouchEnd={handleStop}
                    className="flex-1 bg-white dark:bg-[#2c2c2e] hover:bg-blue-50 dark:hover:bg-[#3a3a3c] text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-t-md flex items-center justify-center transition-colors border border-transparent active:bg-blue-100 dark:active:bg-blue-900/30"
                    tabIndex={-1}
                >
                    <i className="fas fa-chevron-up text-[10px] font-bold"></i>
                </button>
                <button 
                    onMouseDown={() => handleMouseDown(-1)}
                    onMouseUp={handleStop}
                    onMouseLeave={handleStop}
                    onTouchStart={() => handleMouseDown(-1)}
                    onTouchEnd={handleStop}
                    className="flex-1 bg-white dark:bg-[#2c2c2e] hover:bg-blue-50 dark:hover:bg-[#3a3a3c] text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-b-md flex items-center justify-center transition-colors border border-transparent active:bg-blue-100 dark:active:bg-blue-900/30"
                    tabIndex={-1}
                >
                    <i className="fas fa-chevron-down text-[10px] font-bold"></i>
                </button>
            </div>

            {suffixContent && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 scale-100 origin-right">
                    {suffixContent}
                </div>
            )}
        </div>
    );
}

// Info Tooltip Component
interface InfoTooltipProps {
  text: string;
  className?: string;
  direction?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

const InfoTooltip = ({ text, className = "text-current", direction = 'top', align = 'center' }: InfoTooltipProps) => {
  // Determine container alignment classes
  let alignClasses = 'left-1/2 -translate-x-1/2'; // Center default
  let arrowAlignClasses = 'left-1/2 -translate-x-1/2';

  if (align === 'start') {
    alignClasses = 'left-0';
    arrowAlignClasses = 'left-2.5';
  } else if (align === 'end') {
    alignClasses = 'right-0';
    arrowAlignClasses = 'right-2.5';
  }

  // Determine vertical direction classes
  const verticalClasses = direction === 'top' 
    ? 'bottom-full mb-3 transform translate-y-1 group-hover/info:translate-y-0'
    : 'top-full mt-3 transform -translate-y-1 group-hover/info:translate-y-0';

  const arrowDirectionClasses = direction === 'top'
    ? 'top-full border-t-slate-900 dark:border-t-white'
    : 'bottom-full border-b-slate-900 dark:border-b-white';

  return (
    <div className={`relative group/info z-50 inline-flex ml-2 ${className}`}>
      <button className="w-5 h-5 rounded-full border border-current opacity-50 hover:opacity-100 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/10 cursor-help">
         <i className="fas fa-info text-[9px] font-bold"></i>
      </button>
      <div className={`absolute ${alignClasses} ${verticalClasses} w-48 p-3 bg-slate-900 dark:bg-white text-white dark:text-black text-[11px] leading-snug font-medium rounded-xl shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 pointer-events-none text-center z-[100]`}>
         {text}
         {/* Arrow */}
         <div className={`absolute ${arrowAlignClasses} ${arrowDirectionClasses} border-4 border-transparent`}></div>
      </div>
    </div>
  );
};

// Enhanced Searchable Dropdown
const CurrencyDropdown = ({ value, onChange, className, useShortName }: { value: CountryCode, onChange: (v: CountryCode) => void, className?: string, useShortName?: boolean }) => {
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
              className="w-full h-14 pl-3 pr-3 bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl flex items-center gap-3 cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#252528] hover:bg-white/50 dark:hover:bg-[#252528] transition-all duration-200 shadow-sm group"
          >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-black/5 dark:border-white/10 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-200 bg-white">
                  <img src={getFlagUrl(value)} alt={rule.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {useShortName ? rule.currency : rule.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full font-semibold">
                    {useShortName ? rule.name : `${rule.currency} (${rule.code})`}
                  </span>
              </div>
              <i className={`fas fa-chevron-down text-[10px] text-slate-400 ml-auto transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`}></i>
          </button>

          {open && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] max-h-[320px] flex flex-col bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-[#333] z-[60] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-3 border-b border-gray-50 dark:border-[#333] sticky top-0 z-10 bg-inherit">
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
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {useShortName ? c.currency : c.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate font-medium">
                                        {useShortName ? c.name : `(${c.code})`}
                                    </span>
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

  // Correctly handle conditional return AFTER hooks to prevent Error #300
  if (!subRules.length) return null;

  const selectedRegion = subRules.find(r => r.id === value);

  return (
      <div className="relative w-full z-20" ref={ref}>
           <label className="block text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">{rule.subNationalLabel}</label>
           <button 
              onClick={() => setOpen(!open)}
              className="w-full h-14 pl-3 pr-3 bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl flex items-center gap-3 cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#252528] hover:bg-white/50 dark:hover:bg-[#252528] transition-all duration-200 shadow-sm group"
          >
              <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#2c2c2e] flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-200">
                 <i className="fas fa-map-marker-alt text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors"></i>
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {selectedRegion ? selectedRegion.name : `Select ${rule.subNationalLabel}`}
                  </span>
              </div>
              <i className={`fas fa-chevron-down text-[10px] text-slate-400 ml-auto transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`}></i>
          </button>

          {open && (
              <div className="absolute top-full left-0 mt-2 w-full flex flex-col bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-[#333] z-[60] animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[280px]">
                   <div className="p-3 border-b border-gray-50 dark:border-[#333] sticky top-0 z-10 bg-inherit">
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
                             <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#333] flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors">
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
            <div className="flex flex-wrap justify-center gap-3 mt-6">
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 dark:bg-[#1c1c1e]">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.5)]"></div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Tax</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 dark:bg-[#1c1c1e]">
                    <div className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.5)]"></div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Costs</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 dark:bg-[#1c1c1e]">
                    <div className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]"></div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Free</span>
                </div>
            </div>
        </div>
    );
};

type CalcMode = 'gross' | 'net';

// Reusable iOS-style Segmented Control
const SegmentedControl = ({ options, value, onChange, dark }: { options: {label: string, value: string}[], value: string, onChange: (v: any) => void, dark?: boolean }) => (
<div className={`${dark ? 'bg-black/30' : 'bg-slate-200/80 dark:bg-[#1c1c1e]'} p-1 rounded-[14px] flex relative select-none cursor-pointer shadow-inner border border-transparent dark:border-[#333]`}>
    {options.map((opt) => (
        <button 
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-3 text-sm font-extrabold rounded-[10px] transition-all duration-200 active:scale-95 ${
                value === opt.value 
                    ? (dark ? 'bg-white/90 text-slate-900' : 'bg-white dark:bg-[#333] text-black dark:text-white') + ' shadow-[0_2px_8px_rgba(0,0,0,0.08)] transform scale-[1.02] ring-1 ring-black/5 dark:ring-white/10' 
                    : (dark ? 'text-white/60 hover:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
            }`}
        >
            {opt.label}
        </button>
    ))}
</div>
);

const App: React.FC = () => {
  const [inputs, setInputs] = useState<UserInputs>({
    grossIncome: 50000,
    frequency: 'annual',
    country: CountryCode.USA,
    costs: { rent: 0, groceries: 0, utilities: 0, transport: 0, insurance: 0, emergencyFund: 0, debt: 0, freedomFund: 0 },
    details: { age: 30, maritalStatus: 'single', churchTax: false, isExpat: false },
    annualBonus: 0
  });
  
  // Comparison State
  const [isComparison, setIsComparison] = useState(false);
  const [inputsB, setInputsB] = useState<UserInputs>({
      ...inputs,
      country: CountryCode.GBR, // Default comparison to UK
      grossIncome: 40000
  });

  const [mode, setMode] = useState<CalcMode>('gross');
  const [targetNet, setTargetNet] = useState<number>(40000);
  const [showSources, setShowSources] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [highlightIncome, setHighlightIncome] = useState(false);
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
  const debouncedInputsB = useDebounce(inputsB, 250);
  const debouncedTargetNet = useDebounce(targetNet, 250);

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<CountryCode>(CountryCode.USA);
  const [toCurrency, setToCurrency] = useState<CountryCode>(CountryCode.DEU);
  
  const debouncedConvertAmount = useDebounce(convertAmount, 250);

  const currentRules = COUNTRY_RULES[inputs.country];
  const rulesB = COUNTRY_RULES[inputsB.country];

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
  
  // Comparison Result
  const resultB = useMemo(() => {
      if (!isComparison) return null;
      // Mode logic only applies to Inputs A, assume B is entered as Gross for simplicity in comparison mode,
      // OR mirror mode if we want. Let's stick to B being entered directly as Gross to avoid confusion.
      return calculateNetPay(debouncedInputsB);
  }, [debouncedInputsB, isComparison]);

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
    
    // Trigger Highlight Animation
    setHighlightIncome(true);
    setTimeout(() => setHighlightIncome(false), 1500);
  };

  const handleCostChange = (key: keyof UserInputs['costs'], val: number) => {
    setInputs(prev => ({
      ...prev,
      costs: { ...prev.costs, [key]: val }
    }));
  };

  // Function to sync values when toggling mode
  const handleModeToggle = (newMode: CalcMode) => {
    if (newMode === mode) return;

    const isMonthly = inputs.frequency === 'monthly';
    
    if (newMode === 'net') {
        // Switching TO Net mode
        // Pre-fill target net with the current calculated net to ensure continuity
        const currentNet = isMonthly ? result.netMonthly : result.netAnnual;
        setTargetNet(Math.round(currentNet));
    } else {
        // Switching TO Gross mode
        // Pre-fill gross input with the current calculated gross
        const currentGross = isMonthly ? result.grossMonthly : result.grossAnnual;
        setInputs(prev => ({ ...prev, grossIncome: Math.round(currentGross) }));
    }
    setMode(newMode);
  };

  const formatCurrency = (amount: number, code?: CountryCode) => {
    const rules = code ? COUNTRY_RULES[code] : currentRules;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: rules.currency,
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

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#050505] transition-colors duration-300 selection:bg-blue-500/30">
      {/* Glassmorphic Header - Z-Index increased to 110 to be above tooltips (100) and cards (50) */}
      <header className="sticky top-0 z-[110] bg-slate-50/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-[#222]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg text-yellow-400 overflow-hidden border-2 border-white/20">
                    <i className="fas fa-coins text-2xl"></i>
                </div>
                <h1 className="text-xl font-bold tracking-tight hidden sm:block dark:text-white">Global Net Pay</h1>
            </div>
            <div className="flex gap-3 items-center">
                 {/* Comparison Toggle */}
                 <button 
                    onClick={() => setIsComparison(!isComparison)}
                    className={`h-9 px-4 rounded-full border border-gray-200/60 dark:border-[#333] text-[13px] font-bold transition-all duration-200 shadow-sm flex items-center gap-2 active:scale-95 ${isComparison ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-[#18181b] text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-[#222]'}`}
                    title="Compare Countries"
                >
                    <i className="fas fa-balance-scale"></i>
                    <span className="hidden md:inline">Compare</span>
                </button>

                <button 
                    onClick={shareLink}
                    className="h-9 px-5 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-[#333] text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-[#222] transition-all duration-200 shadow-sm flex items-center gap-2 active:scale-95"
                >
                    {copyFeedback ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-share-square text-blue-500"></i>}
                    {copyFeedback ? 'Copied!' : 'Share'}
                </button>
                <button 
                    onClick={() => setShowSources(!showSources)}
                    className="h-9 w-9 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-[#333] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#222] transition-all duration-200 shadow-sm active:scale-95"
                    title="Data Sources"
                >
                    <i className="fas fa-info text-slate-500 dark:text-slate-400 text-sm"></i>
                </button>
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="h-9 w-9 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-[#333] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#222] transition-all duration-200 shadow-sm active:scale-95 text-yellow-500 dark:text-blue-300"
                    title="Toggle Theme"
                >
                    {darkMode ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
        {showSources && (
             <div className="mb-8 bg-white dark:bg-[#101012] border border-orange-100 dark:border-[#333] p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 transition-all duration-300 hover:shadow-xl">
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

        {/* CONDITIONAL RENDERING FOR COMPARISON MODE */}
        {isComparison ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* COMPARISON COLUMN A */}
                    <div className="bg-white dark:bg-[#101012] rounded-3xl p-6 border border-gray-200 dark:border-[#333] shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div>
                            <h3 className="font-bold text-lg">Scenario A</h3>
                        </div>
                        <div className="space-y-4">
                            <CurrencyDropdown value={inputs.country} onChange={(v) => setInputs({...inputs, country: v})} className="w-full" />
                            <SmartNumberInput 
                                value={inputs.grossIncome} 
                                onChangeValue={(v) => setInputs({...inputs, grossIncome: v})}
                                prefix={currentRules.currencySymbol}
                                inputClassName="w-full h-12 pl-10 pr-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-xl font-bold"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Age</label>
                                    <SmartNumberInput value={inputs.details.age} onChangeValue={(v) => setInputs({...inputs, details: {...inputs.details, age: v}})} inputClassName="w-full h-10 pl-2 text-center bg-gray-50 dark:bg-[#1c1c1e] rounded-lg font-bold" />
                                </div>
                                {currentRules.hasMaritalStatusOption && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Status</label>
                                        <select 
                                            value={inputs.details.maritalStatus}
                                            onChange={(e) => setInputs({...inputs, details: {...inputs.details, maritalStatus: e.target.value as any}})}
                                            className="w-full h-10 px-2 bg-gray-50 dark:bg-[#1c1c1e] rounded-lg font-bold text-sm outline-none"
                                        >
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            {/* Result Mini Card A */}
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-xs font-bold text-blue-500 uppercase">Net Annual</p>
                                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{formatCurrency(result.netAnnual, inputs.country)}</p>
                                <p className="text-xs font-medium text-blue-400 mt-1">{(result.netAnnual / result.grossAnnual * 100).toFixed(1)}% of Gross</p>
                            </div>
                        </div>
                    </div>

                    {/* COMPARISON COLUMN B */}
                    <div className="bg-white dark:bg-[#101012] rounded-3xl p-6 border border-gray-200 dark:border-[#333] shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">B</div>
                            <h3 className="font-bold text-lg">Scenario B</h3>
                        </div>
                        <div className="space-y-4">
                            <CurrencyDropdown value={inputsB.country} onChange={(v) => setInputsB({...inputsB, country: v})} className="w-full" />
                            <SmartNumberInput 
                                value={inputsB.grossIncome} 
                                onChangeValue={(v) => setInputsB({...inputsB, grossIncome: v})}
                                prefix={rulesB.currencySymbol}
                                inputClassName="w-full h-12 pl-10 pr-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-xl font-bold"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Age</label>
                                    <SmartNumberInput value={inputsB.details.age} onChangeValue={(v) => setInputsB({...inputsB, details: {...inputsB.details, age: v}})} inputClassName="w-full h-10 pl-2 text-center bg-gray-50 dark:bg-[#1c1c1e] rounded-lg font-bold" />
                                </div>
                                {rulesB.hasMaritalStatusOption && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Status</label>
                                        <select 
                                            value={inputsB.details.maritalStatus}
                                            onChange={(e) => setInputsB({...inputsB, details: {...inputsB.details, maritalStatus: e.target.value as any}})}
                                            className="w-full h-10 px-2 bg-gray-50 dark:bg-[#1c1c1e] rounded-lg font-bold text-sm outline-none"
                                        >
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                             {/* Result Mini Card B */}
                             {resultB && (
                                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                    <p className="text-xs font-bold text-purple-500 uppercase">Net Annual</p>
                                    <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">{formatCurrency(resultB.netAnnual, inputsB.country)}</p>
                                    <p className="text-xs font-medium text-purple-400 mt-1">{(resultB.netAnnual / resultB.grossAnnual * 100).toFixed(1)}% of Gross</p>
                                </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Comparison Charts */}
                {result && resultB && (
                    <div className="bg-white dark:bg-[#101012] rounded-3xl p-8 border border-gray-200 dark:border-[#333] shadow-xl">
                        <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
                            <i className="fas fa-chart-bar text-slate-400"></i> Analysis
                        </h2>
                        
                        <div className="space-y-6">
                             {/* Tax Burden Comparison */}
                             <div>
                                 <div className="flex justify-between text-sm font-bold mb-2">
                                     <span>Tax Burden (Effective Rate)</span>
                                 </div>
                                 <div className="h-8 flex rounded-full overflow-hidden">
                                     <div className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-bold relative" style={{width: '50%'}}>
                                        {((1 - result.netAnnual/result.grossAnnual)*100).toFixed(1)}% (A)
                                     </div>
                                     <div className="bg-purple-500 h-full flex items-center justify-center text-white text-xs font-bold relative" style={{width: '50%'}}>
                                        {((1 - resultB.netAnnual/resultB.grossAnnual)*100).toFixed(1)}% (B)
                                     </div>
                                 </div>
                                 <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>{inputs.country}</span>
                                    <span>{inputsB.country}</span>
                                 </div>
                             </div>
                             
                             {/* Marginal Rate Comparison */}
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-xl">
                                     <p className="text-xs font-bold text-gray-400 uppercase">Marginal Rate (A)</p>
                                     <p className="text-xl font-extrabold">{(result.marginalRate * 100).toFixed(1)}%</p>
                                     <p className="text-[10px] text-gray-400">Tax on next {currentRules.currencySymbol}100</p>
                                 </div>
                                 <div className="p-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-xl">
                                     <p className="text-xs font-bold text-gray-400 uppercase">Marginal Rate (B)</p>
                                     <p className="text-xl font-extrabold">{(resultB.marginalRate * 100).toFixed(1)}%</p>
                                     <p className="text-[10px] text-gray-400">Tax on next {rulesB.currencySymbol}100</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Left Column: Inputs */}
            <div className="lg:col-span-4 space-y-6">
                {/* Income Section */}
                <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] transition-all duration-300 hover:shadow-2xl relative hover:z-50">
                    {/* Gradient Header Background (Clipped) */}
                    <div className="absolute top-0 left-0 right-0 h-[120px] rounded-t-[32px] overflow-hidden z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0034b8] to-[#0c58fa]"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    </div>

                    {/* Header Content (Z-Index Raised to 30 to be above Body) */}
                    <div className="p-6 md:p-8 pb-10 relative z-30 text-white shrink-0">
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-sack-dollar text-white"></i>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-extrabold tracking-tight">Income</h2>
                                        <InfoTooltip text="Enter your gross income, location, and personal details to calculate your net pay." className="text-white" direction="bottom" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-80">
                                        <i className="fas fa-calendar-alt text-[9px]"></i> 2024/25
                                    </span>
                                </div>
                            </div>
                            
                            {/* Compact Gross/Net Toggle */}
                            <div className="bg-black/20 p-1 rounded-lg flex relative z-30 border border-white/10 backdrop-blur-md shadow-inner h-8">
                                <button
                                    onClick={() => handleModeToggle('gross')}
                                    className={`relative z-10 px-3 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all duration-200 flex items-center gap-1.5 ${mode === 'gross' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
                                >
                                    <i className="fas fa-wallet text-[10px]"></i> Gross
                                </button>
                                <button
                                    onClick={() => handleModeToggle('net')}
                                    className={`relative z-10 px-3 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all duration-200 flex items-center gap-1.5 ${mode === 'net' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
                                >
                                    <i className="fas fa-bullseye text-[10px]"></i> Net
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body Content (Z-Index 20) */}
                    <div className="p-6 md:p-8 -mt-4 bg-white dark:bg-[#101012] rounded-b-[32px] rounded-t-[32px] relative z-20 flex flex-col gap-5">
                        <div className="relative z-30">
                            <label className="block text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Where do you live?</label>
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

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                                <label className="text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider">
                                    {mode === 'gross' ? 'Gross Income' : 'Desired Net Income'}
                                </label>
                            </div>
                            
                            <SmartNumberInput
                                value={mode === 'gross' ? inputs.grossIncome : targetNet}
                                onChangeValue={(val) => mode === 'gross' ? setInputs({...inputs, grossIncome: val}) : setTargetNet(val)}
                                step={500}
                                highlight={highlightIncome}
                                prefix={currentRules.currencySymbol}
                                inputClassName={`w-full h-14 pl-14 pr-[140px] bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#252528] focus:ring-4 ${mode === 'net' ? 'focus:ring-green-500/10' : 'focus:ring-blue-500/10'} outline-none transition-all duration-200 font-extrabold text-xl tracking-tight`}
                                suffixContent={
                                    <SegmentedControl 
                                        options={[{label: 'Yr', value: 'annual'}, {label: 'Mo', value: 'monthly'}]}
                                        value={inputs.frequency}
                                        onChange={(v) => setInputs({...inputs, frequency: v})}
                                    />
                                }
                            />

                            {/* Income Range Slider & Presets */}
                            <div className="mt-4 px-1">
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
                                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1c1c1e] text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800 whitespace-nowrap shadow-sm"
                                        >
                                            {formatCompact(preset)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bonus & Details Grid */}
                        <div className="grid grid-cols-2 gap-4 relative z-0">
                            {/* Annual Bonus Input */}
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1 truncate" title="Bonus / 13th Month">Bonus / 13th</label>
                                <SmartNumberInput 
                                    value={inputs.annualBonus || 0}
                                    onChangeValue={(val) => setInputs({...inputs, annualBonus: val})}
                                    step={100}
                                    min={0}
                                    prefix={currentRules.currencySymbol}
                                    inputClassName="w-full h-14 pl-16 pr-8 bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#252528] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-bold text-sm"
                                />
                            </div>
                            
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Age</label>
                                <SmartNumberInput 
                                    value={inputs.details.age}
                                    onChangeValue={(val) => setInputs({...inputs, details: { ...inputs.details, age: val || 30 }})}
                                    step={1}
                                    min={15} max={99}
                                    inputClassName="w-full h-14 pl-2 pr-8 bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-[#252528] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-center font-bold text-slate-900 dark:text-white text-sm"
                                />
                            </div>

                            {currentRules.hasMaritalStatusOption && (
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Marital Status</label>
                                    <div className="grid grid-cols-2 gap-2 bg-[#F2F2F7] dark:bg-[#1c1c1e] p-1 rounded-xl h-14 items-center">
                                        {['single', 'married'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setInputs({...inputs, details: { ...inputs.details, maritalStatus: status as any }})}
                                                className={`h-12 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all duration-200 ${
                                                    inputs.details.maritalStatus === status 
                                                    ? 'bg-white dark:bg-[#333] shadow-sm text-blue-600 dark:text-blue-400 transform scale-[1.02]' 
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
                            <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#1c1c1e] rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer h-14 group" onClick={() => setInputs({...inputs, details: { ...inputs.details, churchTax: !inputs.details.churchTax }})}>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer pointer-events-none">Apply Church Tax</label>
                                <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${inputs.details.churchTax ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600 group-hover:bg-gray-400 dark:group-hover:bg-slate-500'}`}>
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${inputs.details.churchTax ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                        )}

                        {/* NLD 30% Ruling Option */}
                        {currentRules.hasExpatOption && (
                            <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#1c1c1e] rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer h-14 group" onClick={() => setInputs({...inputs, details: { ...inputs.details, isExpat: !inputs.details.isExpat }})}>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer pointer-events-none">30% Ruling (Expat)</label>
                                <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${inputs.details.isExpat ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600 group-hover:bg-gray-400 dark:group-hover:bg-slate-500'}`}>
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${inputs.details.isExpat ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Costs Section */}
                <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] transition-all duration-300 hover:shadow-2xl flex flex-col relative hover:z-50">
                    {/* Gradient Header Background (Clipped) */}
                    <div className="absolute top-0 left-0 right-0 h-[120px] rounded-t-[32px] overflow-hidden z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600"></div>
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none"></div>
                    </div>

                    {/* Header Content (Raised to Z-30) */}
                    <div className="p-6 md:p-8 pb-10 relative z-30 text-white shrink-0">
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-receipt text-white"></i>
                                </div>
                                <h2 className="text-xl font-extrabold tracking-tight">Monthly Costs</h2>
                                <InfoTooltip text="Input your recurring monthly costs (rent, groceries, etc.) to see your disposable income." className="text-white" direction="bottom" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">Optional</span>
                        </div>
                    </div>

                    {/* Body Content (Z-20) */}
                    <div className="p-6 md:p-8 -mt-4 bg-white dark:bg-[#101012] rounded-t-[32px] rounded-b-[32px] relative z-20 flex-grow flex flex-col">
                        
                        {/* Budget Dashboard */}
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
                                        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Remaining</p>
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
                                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{field.label}</label>
                                        {pct > 1 && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pct > 50 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-[#2c2c2e] dark:text-slate-400'}`}>
                                                {pct.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                    
                                    <SmartNumberInput
                                        value={val || 0}
                                        onChangeValue={(v) => handleCostChange(field.key as any, v)}
                                        step={50}
                                        min={0}
                                        prefix={currentRules.currencySymbol}
                                        inputClassName="w-full h-14 pl-14 pr-8 bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#2c2c2e] focus:ring-4 focus:ring-red-500/10 outline-none transition-all duration-200 font-bold text-sm"
                                    />
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
                        {/* Hero Card (Gross) */}
                        <div 
                            className="relative rounded-[32px] shadow-2xl group border border-white/10 transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] h-auto min-h-[200px] perspective-1000 bg-black hover:z-50"
                            style={{ perspective: '1000px' }}
                        >
                            {/* Clipped Background Layer */}
                            <div className="absolute inset-0 rounded-[32px] overflow-hidden z-0 transform-style-3d transition-transform duration-700 group-hover:rotate-x-2 group-hover:rotate-y-2 group-hover:scale-105 origin-center">
                                <img 
                                    src={getHDFlagUrl(inputs.country)} 
                                    alt="Country Flag" 
                                    className="w-full h-full object-cover contrast-125 saturate-[1.1] brightness-75 dark:brightness-50"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 mix-blend-multiply"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                            </div>

                            {/* Content Layer */}
                            <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                                            <i className="fas fa-briefcase text-xl text-white drop-shadow-md"></i>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white/90 text-base md:text-lg font-bold uppercase tracking-wider shadow-black drop-shadow-md">
                                                {mode === 'net' ? 'Required Gross Annual' : 'Gross Annual Income'}
                                            </p>
                                            <InfoTooltip text="This is the total yearly salary before any taxes or deductions are taken out." className="text-white" direction="bottom" />
                                        </div>
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl mt-2 leading-none break-words">
                                        {formatCurrency(result.grossAnnual)}
                                    </h2>
                                </div>
                                
                                {/* Enlarged Monthly Button */}
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
                            <div className="relative rounded-[32px] shadow-lg text-white group border border-white/10 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:z-50">
                                {/* Clipped Background */}
                                <div className="absolute inset-0 rounded-[32px] overflow-hidden z-0 bg-gradient-to-br from-[#007AFF] to-[#0055ff] dark:from-[#0055ff] dark:to-[#0033cc]">
                                    <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                        <i className="fas fa-money-bill-wave"></i>
                                    </div>
                                </div>
                                
                                <div className="absolute top-6 right-6 z-20">
                                    <InfoTooltip text="The actual amount of money landing in your bank account each month after all taxes." className="text-white" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col h-full justify-between p-6">
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
                            <div className="relative rounded-[32px] shadow-lg text-white group border border-white/10 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:z-50">
                                {/* Clipped Background */}
                                <div className="absolute inset-0 rounded-[32px] overflow-hidden z-0 bg-gradient-to-br from-[#34C759] to-[#2a9d48] dark:from-[#1b8a3b] dark:to-[#146c2e]">
                                    <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                        <i className="fas fa-star"></i>
                                    </div>
                                </div>

                                <div className="absolute top-6 right-6 z-20">
                                    <InfoTooltip text="The amount you have left after paying taxes AND your monthly living costs (rent, bills, etc)." className="text-white" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col h-full justify-between p-6">
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
                            <div className="relative rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] text-slate-900 dark:text-white group flex flex-col justify-between h-full transition-all duration-300 hover:shadow-2xl hover:z-50">
                                {/* Clipped Background */}
                                <div className="absolute inset-0 rounded-[32px] overflow-hidden z-0 bg-white dark:bg-[#101012]">
                                    <div className="absolute -right-8 -bottom-8 text-slate-50 dark:text-[#18181b] text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                        <i className="fas fa-chart-pie"></i>
                                    </div>
                                </div>

                                <div className="relative z-10 w-full h-full flex flex-col p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center border border-slate-50 dark:border-[#333]">
                                            <i className="fas fa-chart-pie text-lg text-slate-900 dark:text-white"></i>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold uppercase tracking-wider">Tax / Cost Ratio</p>
                                        <InfoTooltip text="Visual breakdown of where your money goes: Taxes (Red), Living Costs (Blue), and Savings (Green)." className="text-slate-400" />
                                    </div>
                                    <div className="flex-grow flex items-center justify-center mt-2">
                                        <DonutChart result={result} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Convert Horizontal Card */}
                        <div className="rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] transition-all duration-300 hover:shadow-2xl group/converter relative z-30 bg-white dark:bg-[#101012] hover:z-50">
                            
                            {/* Clipped Header Background */}
                            <div className="absolute top-0 left-0 right-0 h-[96px] rounded-t-[32px] overflow-hidden z-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#2FB050] to-[#A0E870]"></div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-32 pointer-events-none"></div>
                                <i className="fas fa-coins text-white/20 text-6xl absolute -right-4 -bottom-8 rotate-12"></i>
                            </div>

                            {/* Header Content (Raised to Z-30) */}
                            <div className="p-5 relative z-30 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                        <i className="fas fa-exchange-alt text-white"></i>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-lg tracking-tight text-white leading-none">Quick Convert</h3>
                                            <InfoTooltip text="Estimate how much this salary is worth in another currency or country." className="text-white" direction="bottom" />
                                        </div>
                                        <p className="text-white/80 text-xs font-medium mt-1">{getRateDisplay()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Body Content (Z-20) */}
                            <div className="p-6 relative z-20 rounded-b-[32px] bg-white dark:bg-[#101012]">
                                <div className="flex flex-col md:flex-row items-end gap-4 relative">
                                    
                                    {/* FROM */}
                                    <div className="flex-1 w-full space-y-2">
                                        <div className="flex justify-between px-1">
                                            <label className="text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider">From</label>
                                            <span className="text-[10px] font-bold text-slate-400">{COUNTRY_RULES[fromCurrency].name}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <CurrencyDropdown value={fromCurrency} onChange={setFromCurrency} useShortName={true} />
                                            <div className="relative flex-1">
                                                <SmartNumberInput 
                                                    value={convertAmount}
                                                    onChangeValue={setConvertAmount}
                                                    step={100}
                                                    min={0}
                                                    inputClassName="w-full h-14 pl-4 pr-8 bg-[#F2F2F7] dark:bg-[#1c1c1e] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-extrabold text-lg outline-none focus:bg-white dark:focus:bg-[#252528] focus:ring-4 focus:ring-[#2FB050]/10 transition-all duration-200 shadow-inner"
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
                                            <label className="text-[11px] font-bold text-[#86868b] dark:text-slate-500 uppercase tracking-wider">To</label>
                                            <span className="text-[10px] font-bold text-slate-400">{COUNTRY_RULES[toCurrency].name}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <CurrencyDropdown value={toCurrency} onChange={setToCurrency} useShortName={true} />
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
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <span>Use this Salary</span>
                                        <i className="fas fa-arrow-up transform rotate-45"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown Table */}
                        <div className="bg-white dark:bg-[#101012] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white dark:border-[#222] transition-all duration-300 hover:shadow-2xl relative z-10 hover:z-50">
                            {/* Clipped Header Background */}
                            <div className="absolute top-0 left-0 right-0 h-[88px] rounded-t-[32px] overflow-hidden z-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900"></div>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            </div>

                            {/* Header Content (Raised to Z-30) */}
                            <div className="p-6 flex justify-between items-center relative z-30">
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                        <i className="fas fa-list-alt text-white"></i>
                                    </div>
                                    <h3 className="font-extrabold text-lg text-white tracking-tight">Payslip Breakdown</h3>
                                    <InfoTooltip text="A line-by-line explanation of every tax and deduction taken from your salary." className="text-white" direction="bottom" />
                                </div>
                                <button onClick={downloadPDF} className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-colors backdrop-blur-md active:scale-95 duration-150">
                                    <i className="fas fa-arrow-down-to-line"></i> Get PDF
                                </button>
                            </div>

                            {/* Body Content (Z-20) */}
                            <div className="p-0 overflow-x-auto relative z-20 rounded-b-[32px] bg-white dark:bg-[#101012]">
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
                                        <tr className="text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#1c1c1e] transition-colors">
                                            <td className="px-6 py-4 pl-8 font-bold flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><i className="fas fa-briefcase text-[10px]"></i></div>
                                                Base Salary
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatCurrency(result.grossAnnual)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatCurrency(result.grossMonthly)}</td>
                                            <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-500 font-semibold">100%</td>
                                        </tr>
                                        {inputs.annualBonus > 0 && (
                                            <tr className="text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#1c1c1e] transition-colors">
                                                <td className="px-6 py-4 pl-8 font-bold flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><i className="fas fa-gift text-[10px]"></i></div>
                                                    Annual Bonus
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold whitespace-nowrap">{formatCurrency(inputs.annualBonus)}</td>
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
                                                            <div className="absolute left-0 bottom-6 w-64 bg-[#1d1d1f] dark:bg-black text-white text-xs p-3 rounded-xl shadow-xl hidden group-hover:block z-20 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium border border-gray-700">
                                                                {d.description}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium whitespace-nowrap">{d.amount < 0 ? '+' : '-'}{formatCurrency(Math.abs(d.amount))}</td>
                                                <td className="px-6 py-4 text-right font-medium whitespace-nowrap">{d.amount < 0 ? '+' : '-'}{formatCurrency(Math.abs(d.amount / 12))}</td>
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
                                            <td className="px-6 py-4 text-right font-extrabold text-blue-700 dark:text-blue-400 whitespace-nowrap">{formatCurrency(result.netAnnual)}</td>
                                            <td className="px-6 py-4 text-right font-extrabold text-blue-700 dark:text-blue-400 whitespace-nowrap">{formatCurrency(result.netMonthly)}</td>
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
                                                    <tr key={`emp-${idx}`} className="text-slate-400 dark:text-slate-500 italic hover:bg-slate-50 dark:hover:bg-[#1c1c1e] transition-colors">
                                                        <td className="px-6 py-3 pl-8 flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#2c2c2e] flex items-center justify-center text-slate-500"><i className="fas fa-building text-[10px]"></i></div>
                                                            {d.name}
                                                        </td>
                                                        <td className="px-6 py-3 text-right whitespace-nowrap">{formatCurrency(d.amount)}</td>
                                                        <td className="px-6 py-3 text-right whitespace-nowrap">{formatCurrency(d.amount / 12)}</td>
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
        )}
      </main>
      {/* Hidden Invoice Template for PDF Generation */}
      <div id="pdf-invoice-template" className="fixed top-0 left-0 -z-50 bg-white text-slate-900 p-12 w-[210mm] min-h-[297mm]" style={{ fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b border-gray-200 pb-8">
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-yellow-400">
                        <i className="fas fa-coins text-3xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Global Net Pay Calculator</h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">Salary & Tax Estimation Statement</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest mb-2">INVOICE / STATEMENT</h2>
                    <p className="text-sm font-bold text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-gray-500">Ref: {inputs.country}-{new Date().getFullYear()}</p>
                </div>
            </div>

            {/* Summary Section */}
            <div className="flex justify-between items-end mb-10">
                <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Employee Details</p>
                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                        <span className="font-bold text-slate-700">Country:</span>
                        <span className="font-medium">{currentRules.name}</span>
                        <span className="font-bold text-slate-700">Age:</span>
                        <span className="font-medium">{inputs.details.age}</span>
                        <span className="font-bold text-slate-700">Status:</span>
                        <span className="font-medium capitalize">{inputs.details.maritalStatus}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SUMMARY</p>
                    <h1 className="text-5xl font-extrabold text-slate-900">{formatCurrency(result.grossAnnual)}</h1>
                    <p className="text-sm font-bold text-slate-500 mt-1">Gross Annual Income</p>
                </div>
            </div>

            {/* Main Table */}
            <div className="mb-10">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                            <th className="py-3 px-4 text-left rounded-l-lg">Description</th>
                            <th className="py-3 px-4 text-right">Annual</th>
                            <th className="py-3 px-4 text-right">Monthly</th>
                            <th className="py-3 px-4 text-right rounded-r-lg w-20">%</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800">
                        {/* Gross */}
                        <tr className="font-bold border-b border-gray-100">
                            <td className="py-4 px-4">Gross Income</td>
                            <td className="py-4 px-4 text-right">{formatCurrency(result.grossAnnual)}</td>
                            <td className="py-4 px-4 text-right">{formatCurrency(result.grossMonthly)}</td>
                            <td className="py-4 px-4 text-right">100%</td>
                        </tr>
                        
                        {/* Bonus */}
                        {inputs.annualBonus > 0 && (
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-4 pl-8 text-slate-600 italic">Included Bonus</td>
                                <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(inputs.annualBonus)}</td>
                                <td className="py-3 px-4 text-right text-slate-600">-</td>
                                <td className="py-3 px-4 text-right text-slate-600">-</td>
                            </tr>
                        )}

                        {/* Deductions */}
                        {employeeDeductions.map((d, i) => (
                            <tr key={i} className="border-b border-gray-50 text-red-600">
                                <td className="py-3 px-4">{d.name}</td>
                                <td className="py-3 px-4 text-right">{d.amount < 0 ? '+' : '-'}{formatCurrency(Math.abs(d.amount))}</td>
                                <td className="py-3 px-4 text-right">{d.amount < 0 ? '+' : '-'}{formatCurrency(Math.abs(d.amount/12))}</td>
                                <td className="py-3 px-4 text-right">{(d.amount / result.grossAnnual * 100).toFixed(1)}%</td>
                            </tr>
                        ))}

                        {/* Net Pay Highlight */}
                        <tr className="bg-slate-50 font-extrabold text-lg">
                            <td className="py-5 px-4 uppercase tracking-tight">NET INCOME</td>
                            <td className="py-5 px-4 text-right">{formatCurrency(result.netAnnual)}</td>
                            <td className="py-5 px-4 text-right">{formatCurrency(result.netMonthly)}</td>
                            <td className="py-5 px-4 text-right text-base">{(result.netAnnual / result.grossAnnual * 100).toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Monthly Costs Breakdown (PDF) */}
            {result.personalCostsTotal > 0 && (
                 <div className="mb-8 border rounded-xl p-6 bg-slate-50 border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Monthly Living Costs Breakdown</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                         {costFields.map(field => {
                             const val = (inputs.costs as any)[field.key];
                             if (!val) return null;
                             return (
                                 <div key={field.key} className="flex justify-between">
                                     <span className="text-slate-600 font-medium">{field.label}</span>
                                     <span className="text-slate-900 font-bold">{formatCurrency(val)}</span>
                                 </div>
                             )
                         })}
                         <div className="flex justify-between mt-2 pt-2 border-t border-slate-300 font-bold">
                             <span>Total Costs</span>
                             <span>{formatCurrency(result.personalCostsTotal)}</span>
                         </div>
                    </div>
                 </div>
            )}

            {/* Disposable Income Highlight */}
            <div className="bg-[#effef3] border border-[#bbf7d0] rounded-2xl p-8 flex justify-between items-center mb-12">
                <div>
                    <h3 className="text-xl font-extrabold text-[#15803d] uppercase tracking-tight">Disposable Income (Free Cash)</h3>
                    <p className="text-sm font-bold text-[#16a34a]">After Taxes & Living Costs</p>
                </div>
                <div className="flex gap-12 text-right">
                    <div>
                         <p className="text-3xl font-extrabold text-[#15803d]">{formatCurrency(Math.max(0, result.netAnnual - (result.personalCostsTotal * 12)))}</p>
                         <p className="text-xs font-bold text-[#16a34a] uppercase mt-1">Annual</p>
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-[#15803d]">{formatCurrency(result.disposableMonthly)}</p>
                         <p className="text-xs font-bold text-[#16a34a] uppercase mt-1">Monthly</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-gray-100 pt-8 text-xs text-gray-400 leading-relaxed">
                <p>Generated by Global Net Pay Calculator. This document is for estimation purposes only and does not constitute official financial advice.</p>
                <p className="mt-2">Source Rules: {currentRules.sources.map(s => s.label).join(', ')}</p>
            </div>
      </div>

      <GeminiAssistant country={inputs.country} countryName={currentRules.name} />
    </div>
  );
};

export default App;
