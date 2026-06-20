import { useState, useRef, useEffect } from "react";

export type CustomSelectOption = {
  value: string;
  label: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  className = "",
  borderClass = "border border-slate-200",
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  borderClass?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 bg-slate-50 ${borderClass} rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 flex items-center justify-between text-left font-medium`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span
          className="material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-200 flex-shrink-0"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-60 overflow-y-auto animate-fade-in py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                value === opt.value ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-700"
              }`}
            >
              <span className="truncate pr-4">{opt.label}</span>
              {value === opt.value && (
                <span className="material-symbols-outlined text-[16px] text-amber-600 flex-shrink-0">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
