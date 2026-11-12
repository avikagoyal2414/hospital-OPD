import { CheckCircle2, AlertTriangle } from "lucide-react";

export const focusRing =
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5ED7] focus-visible:ring-offset-2";

export function OptionCard({ selected, onClick, icon: Icon, title, sub }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full min-h-[56px] text-left flex items-center gap-3 p-4 rounded-xl border-2 ${focusRing}
        ${selected ? "border-[#0B5ED7] bg-blue-50 ring-2 ring-[#0B5ED7]" : "border-[#111827] bg-white"}`}
    >
      {Icon && <Icon className="shrink-0" size={28} aria-hidden="true" />}
      <span className="flex-1">
        <span className="block font-bold text-lg">{title}</span>
        {sub && <span className="block text-base text-gray-700">{sub}</span>}
      </span>
      {selected && <CheckCircle2 className="text-[#0B5ED7] shrink-0" size={28} aria-hidden="true" />}
    </button>
  );
}

export function PrimaryButton({ children, onClick, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] bg-[#0B5ED7] text-white font-bold text-lg
        flex items-center justify-center gap-2 disabled:opacity-50 ${focusRing}`}
    >
      {children}
    </button>
  );
}

export function ErrorBanner({ message, bannerRef }) {
  if (!message) return null;
  return (
    <div
      ref={bannerRef}
      tabIndex={-1}
      role="alert"
      className="flex items-start gap-3 p-4 rounded-xl border-2 border-red-800 bg-amber-100 text-red-900 font-bold text-lg focus:outline-none"
    >
      <AlertTriangle className="shrink-0" size={28} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}