import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Pencil,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Teammate's state may be a plain string OR an object. Handle both.
const toText = (v, fallback = "Not selected") => {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  return v.name || v.label || v.title || fallback;
};

const patientText = (p) => {
  if (!p) return "Not selected";
  if (typeof p === "string") return p;
  const name = p.name || p.label || "Patient";
  return p.age ? `${name}, ${p.age}` : name;
};

const deptText = (d) => {
  if (!d) return "Not selected";
  if (typeof d === "string") return d;
  return d.short || d.title || d.label || d.name || "Not selected";
};

const dateText = (d) => {
  if (!d) return "Not selected";
  if (typeof d === "string") return d;
  return d.short || d.label || d.name || "Not selected";
};

const slotText = (t) => {
  if (!t) return "Not selected";
  if (typeof t === "string") return t;
  const hours = t.sub || (t.start && t.end ? `${t.start} – ${t.end}` : t.start);
  if (hours && t.label) return `${t.label} (${hours})`;
  return hours || t.label || "Not selected";
};

const COLORS = {
  bg: "#FAF9F6",
  ink: "#111827",
  blue: "#0B5ED7",
  green: "#0F5132",
  greenSoft: "#E8F3EC",
  line: "#9CA3AF",
};

/* ------------------------------------------------------------------ */
/* Deterministic SVG QR-style placeholder (no library needed)          */
/* ------------------------------------------------------------------ */

function QrPlaceholder({ size = 176 }) {
  const N = 21;
  let seed = 14; // token number -> same pattern every render
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const inFinderZone = (r, c) =>
    (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);

  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!inFinderZone(r, c) && rand() > 0.5) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
      }
    }
  }

  const Finder = ({ x, y }) => (
    <g>
      <rect x={x} y={y} width="7" height="7" fill="#000" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#000" />
    </g>
  );

  return (
    <svg
      role="img"
      aria-label="QR code for your OPD token"
      width={size}
      height={size}
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      shapeRendering="crispEdges"
      style={{ background: "#fff" }}
    >
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      <g fill="#000">{cells}</g>
      <Finder x={0} y={0} />
      <Finder x={N - 7} y={0} />
      <Finder x={0} y={N - 7} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function StepThreeReview({
  patient,
  department,
  hospital,
  date,
  timeSlot,
  doctor,
  onBack,
  onReset,
  isLargeText = false,
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState("");

  const k = isLargeText ? 1.25 : 1;
  const fs = (px) => ({ fontSize: `${px * k}px`, lineHeight: 1.35 });

  const details = [
    { label: "Patient", value: patientText(patient) },
    { label: "Hospital", value: toText(hospital) },
    { label: "Department", value: deptText(department) },
    ...(doctor ? [{ label: "Doctor", value: toText(doctor) }] : []),
    { label: "Date", value: dateText(date) },
    { label: "Time", value: slotText(timeSlot) },
    { label: "Consultation fee", value: "₹0 (Free Govt OPD)", strong: true },
  ];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleConfirm = () => {
    setConfirmed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWhatsApp = () => setToast("Sent to +91 98XXX XXXXX!");

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#0B5ED7]";

  /* ---------------- AFTER CONFIRMATION: Digital OPD Pass ---------------- */
  if (confirmed) {
    return (
      <div style={{ color: COLORS.ink }}>
        {/* Calm green header */}
        <div
          className="-mx-4 -mt-4 px-5 py-6 flex items-center gap-3"
          style={{ background: COLORS.green, color: "#FFFFFF" }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={40 * k} aria-hidden="true" />
          <div>
            <h2 className="font-bold" style={fs(26)}>
              Appointment Confirmed!
            </h2>
            <p style={fs(18)}>Your visit is booked. No payment needed.</p>
          </div>
        </div>

        <div className="pt-5 space-y-5">
          {/* Digital OPD Pass */}
          <section
            aria-label="Digital OPD Pass"
            className="rounded-2xl bg-white overflow-hidden"
            style={{ border: `3px solid ${COLORS.green}` }}
          >
            <div
              className="px-4 py-3 text-center font-bold"
              style={{ background: COLORS.greenSoft, color: COLORS.green, ...fs(18) }}
            >
              Digital OPD Pass
            </div>

            <div className="px-4 pt-5 text-center">
              <p className="font-semibold" style={fs(18)}>
                Your token number
              </p>
              <p
                className="font-extrabold tracking-wide"
                style={{ color: COLORS.green, fontSize: `${64 * k}px`, lineHeight: 1.1 }}
              >
                #A-14
              </p>
            </div>

            <div className="flex justify-center py-4">
              <div className="p-2 bg-white" style={{ border: `2px solid ${COLORS.ink}` }}>
                <QrPlaceholder size={176 * (isLargeText ? 1.1 : 1)} />
              </div>
            </div>

            <div
              className="mx-4 mb-4 rounded-xl px-4 py-3 font-bold text-center"
              style={{ background: COLORS.ink, color: "#FFFFFF", ...fs(20) }}
            >
              Show this screen at Counter 4, OPD Block, {toText(hospital, "the hospital")}
            </div>

            <dl className="px-4 pb-4">
              {details.map((d) => (
                <div
                  key={d.label}
                  className="py-3"
                  style={{ borderTop: `1px solid ${COLORS.line}` }}
                >
                  <dt className="font-medium" style={{ ...fs(18), color: "#374151" }}>
                    {d.label}
                  </dt>
                  <dd className="font-bold" style={fs(20)}>
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Actions */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className={`w-full min-h-[56px] rounded-xl font-bold flex items-center justify-center gap-3 px-4 ${focusRing}`}
            style={{ background: COLORS.blue, color: "#FFFFFF", border: `2px solid ${COLORS.blue}`, ...fs(20) }}
          >
            <MessageCircle size={26 * k} aria-hidden="true" />
            Send Slip to WhatsApp
          </button>

          <button
            type="button"
            onClick={onReset}
            className={`w-full min-h-[56px] rounded-xl font-bold flex items-center justify-center gap-3 px-4 bg-white ${focusRing}`}
            style={{ color: COLORS.ink, border: `2px solid ${COLORS.ink}`, ...fs(20) }}
          >
            <RotateCcw size={26 * k} aria-hidden="true" />
            Book Another Appointment
          </button>
        </div>

        {/* Toast */}
        <div aria-live="polite" role="status">
          {toast && (
            <div
              className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 w-[calc(100%-2rem)] max-w-[398px] rounded-xl px-4 py-4 font-bold text-center shadow-xl"
              style={{ background: COLORS.ink, color: "#FFFFFF", ...fs(18) }}
            >
              {toast}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- BEFORE CONFIRMATION: Review ---------------- */
  return (
    <div className="space-y-5" style={{ color: COLORS.ink }}>
      <h2 className="font-bold" style={fs(26)}>
        Check Your Appointment Details
      </h2>

      <section
        aria-label="Appointment summary"
        className="rounded-2xl bg-white px-4"
        style={{ border: `2px solid ${COLORS.ink}` }}
      >
        <dl>
          {details.map((d, i) => (
            <div
              key={d.label}
              className="py-3"
              style={i === 0 ? undefined : { borderTop: `1px solid ${COLORS.line}` }}
            >
              <dt className="font-medium" style={{ ...fs(18), color: "#374151" }}>
                {d.label}
              </dt>
              <dd
                className="font-bold"
                style={{ ...fs(20), color: d.strong ? COLORS.green : COLORS.ink }}
              >
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Reassurance */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: COLORS.greenSoft, border: `2px solid ${COLORS.green}`, color: COLORS.green }}
      >
        <ShieldCheck size={28 * k} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p className="font-semibold" style={fs(18)}>
          No CAPTCHA required. You can cancel or reschedule anytime.
        </p>
      </div>

      {/* Primary action */}
      <button
        type="button"
        onClick={handleConfirm}
        className={`w-full min-h-[60px] rounded-xl font-bold flex items-center justify-center gap-3 px-4 ${focusRing}`}
        style={{ background: COLORS.green, color: "#FFFFFF", border: `2px solid ${COLORS.green}`, ...fs(22) }}
      >
        <CheckCircle2 size={28 * k} aria-hidden="true" />
        Confirm OPD Appointment
      </button>

      {/* Secondary action */}
      {onBack && (
      <button
        type="button"
        onClick={onBack}
        className={`w-full min-h-[56px] rounded-xl font-bold flex items-center justify-center gap-3 px-4 bg-white ${focusRing}`}
        style={{ color: COLORS.blue, border: `2px solid ${COLORS.blue}`, ...fs(20) }}
      >
        <Pencil size={24 * k} aria-hidden="true" />
        Change Details
      </button>
      )}
    </div>
  );
}