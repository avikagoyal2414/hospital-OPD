import { useState, useMemo } from "react";
import { CheckCircle2, MessageCircle, RotateCcw } from "lucide-react";

const N = 21;

// Fake but good-looking QR (finder squares + seeded dots) for the prototype
function QRPlaceholder({ seed = "A-104" }) {
  const cells = useMemo(() => {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
    const finder = (r, c) => {
      for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
        const lr = r - r0, lc = c - c0;
        if (lr >= 0 && lr < 7 && lc >= 0 && lc < 7) {
          return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
        }
      }
      return null;
    };
    const out = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const f = finder(r, c);
        if (f === true || (f === null && rand() > 0.5)) out.push([r, c]);
      }
    return out;
  }, [seed]);

  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label="QR code for OPD token"
      className="w-28 h-28 shrink-0 border-2 border-[#111827] bg-white" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      {cells.map(([r, c]) => <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#111827" />)}
    </svg>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-3 border-b-2 border-gray-200 last:border-b-0">
      <dt className="text-gray-700">{label}</dt>
      <dd className="font-bold text-right">{value}</dd>
    </div>
  );
}

export default function StepThreeReview({ patient, department, hospital, date, timeSlot, doctor, onReset }) {
  const [toast, setToast] = useState(false);

  const sendToWhatsApp = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Big green confirmation box */}
      <div role="status"
        className="rounded-2xl border-2 border-[#0F5132] bg-[#0F5132] text-white p-6 flex flex-col items-center text-center gap-2">
        <CheckCircle2 size={64} aria-hidden="true" />
        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-lg">Your OPD appointment is booked</p>
      </div>

      {/* Digital OPD pass */}
      <div className="rounded-xl border-2 border-[#111827] bg-white p-4 flex items-center gap-4">
        <QRPlaceholder />
        <div className="space-y-1">
          <p className="inline-block border-2 border-[#111827] px-2 py-1 font-bold text-base">DIGITAL OPD PASS</p>
          <p className="text-2xl font-bold">TOKEN: #A-104</p>
          <p className="text-base">Ground Floor, Room 12</p>
        </div>
      </div>

      {/* Details */}
      <section className="rounded-xl border-2 border-[#111827] bg-white p-4">
        <h2 className="text-2xl font-bold mb-1">Patient</h2>
        <dl>
          <Row label="Name" value={`${patient?.name}, ${patient?.age}`} />
          <Row label="Department" value={department?.short} />
          <Row label="Doctor" value={doctor?.name} />
          <Row label="Date" value={`${date?.short} (${timeSlot?.start})`} />
          <Row label="Hospital" value={hospital?.name} />
          <Row label="Fee" value="₹0 (Free Govt OPD)" />
        </dl>
      </section>

      <button type="button" onClick={sendToWhatsApp}
        className="w-full min-h-[56px] rounded-xl border-2 border-[#0F5132] bg-white text-[#0F5132] font-bold text-lg flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5ED7]">
        <MessageCircle size={24} aria-hidden="true" /> Send Pass to WhatsApp
      </button>

      <button type="button" onClick={onReset}
        className="w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold text-lg flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5ED7]">
        <RotateCcw size={24} aria-hidden="true" /> Book Another Appointment
      </button>

      {toast && (
        <div role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-xl bg-[#111827] text-white font-bold px-5 py-4 shadow-xl">
          Sent to +91 98XXX XXXXX!
        </div>
      )}
    </div>
  );
}