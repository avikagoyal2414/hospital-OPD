import { useState, useMemo, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, MessageCircle, RotateCcw, Ban } from "lucide-react";
import { playConfirmed, playCancelled } from "./sounds";
import { focusRing } from "./ui";

const N = 21;

// Fake but good-looking QR for the prototype
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
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label="QR code"
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

export default function StepThreeReview({
  t, say, phone, patient, deptLabel, doctorName, dateLabel, timeLabel, hospital, onReset,
}) {
  const [status, setStatus] = useState("booked"); // booked | cancelled
  const [asking, setAsking] = useState(false);    // "are you sure?" dialog
  const [toast, setToast] = useState(false);
  const played = useRef(false);

  // chime + voice when the booking is confirmed (once)
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    playConfirmed();
    say(t("vConfirmed", { dept: deptLabel, date: dateLabel, slot: timeLabel, hospital: hospital.name }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askCancel = () => { setAsking(true); say(t("sureTitle")); };
  const keepBooking = () => { setAsking(false); say(t("keepIt")); };
  const confirmCancel = () => {
    setAsking(false);
    setStatus("cancelled");
    playCancelled();
    say(t("vCancelled"));
  };

  const sendToWhatsApp = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };
  const masked = `${phone.slice(0, 2)}XXX XXXXX`;

  if (status === "cancelled") {
    return (
      <div className="space-y-4">
        <div role="status"
          className="rounded-2xl border-2 border-red-800 bg-red-700 text-white p-6 flex flex-col items-center text-center gap-2">
          <XCircle size={64} aria-hidden="true" />
          <h1 className="text-3xl font-bold">{t("cancelledTitle")}</h1>
          <p className="text-lg">{t("cancelledSub")}</p>
        </div>
        <button type="button" onClick={onReset}
          className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] bg-[#0B5ED7] text-white font-bold text-lg flex items-center justify-center gap-2 ${focusRing}`}>
          <RotateCcw size={24} aria-hidden="true" /> {t("bookNew")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Big green confirmation box */}
      <div role="status"
        className="rounded-2xl border-2 border-[#0F5132] bg-[#0F5132] text-white p-6 flex flex-col items-center text-center gap-2">
        <CheckCircle2 size={64} aria-hidden="true" />
        <h1 className="text-3xl font-bold">{t("confirmed")}</h1>
        <p className="text-lg">{t("confirmedSub")}</p>
      </div>

      {/* Digital OPD pass */}
      <div className="rounded-xl border-2 border-[#111827] bg-white p-4 flex items-center gap-4">
        <QRPlaceholder />
        <div className="space-y-1">
          <p className="inline-block border-2 border-[#111827] px-2 py-1 font-bold text-base">{t("passTitle")}</p>
          <p className="text-2xl font-bold">{t("token")}: #A-104</p>
          <p className="text-base">{t("location")}</p>
        </div>
      </div>

      {/* Details */}
      <section className="rounded-xl border-2 border-[#111827] bg-white p-4">
        <h2 className="text-2xl font-bold mb-1">{t("patientH")}</h2>
        <dl>
          <Row label={t("rName")} value={`${patient.name}, ${patient.age}`} />
          <Row label={t("rDept")} value={deptLabel} />
          <Row label={t("rDoctor")} value={doctorName} />
          <Row label={t("rDate")} value={dateLabel} />
          <Row label={t("rTime")} value={timeLabel} />
          <Row label={t("rHospital")} value={hospital.name} />
          <Row label={t("rFee")} value={t("free")} />
        </dl>
      </section>

      <button type="button" onClick={sendToWhatsApp}
        className={`w-full min-h-[56px] rounded-xl border-2 border-[#0F5132] bg-white text-[#0F5132] font-bold text-lg flex items-center justify-center gap-2 ${focusRing}`}>
        <MessageCircle size={24} aria-hidden="true" /> {t("whatsapp")}
      </button>

      <button type="button" onClick={onReset}
        className={`w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold text-lg flex items-center justify-center gap-2 ${focusRing}`}>
        <RotateCcw size={24} aria-hidden="true" /> {t("bookAnother")}
      </button>

      {/* Cancel — highlighted in red, below Book Another */}
      <button type="button" onClick={askCancel}
        className={`w-full min-h-[56px] rounded-xl border-2 border-red-800 bg-red-700 text-white font-bold text-lg flex items-center justify-center gap-2 ${focusRing}`}>
        <Ban size={24} aria-hidden="true" /> {t("cancelAppt")}
      </button>

      {/* "Are you sure?" dialog */}
      {asking && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end justify-center"
          role="alertdialog" aria-modal="true" aria-labelledby="cancel-title">
          <div className="w-full max-w-[430px] bg-[#FAF9F6] rounded-t-2xl p-5 space-y-3">
            <h2 id="cancel-title" className="text-2xl font-bold">{t("sureTitle")}</h2>
            <p>{t("sureSub")}</p>
            <button type="button" autoFocus onClick={keepBooking}
              className={`w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold text-lg ${focusRing}`}>
              {t("keepIt")}
            </button>
            <button type="button" onClick={confirmCancel}
              className={`w-full min-h-[56px] rounded-xl border-2 border-red-800 bg-red-700 text-white font-bold text-lg ${focusRing}`}>
              {t("yesCancel")}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-[#111827] text-white font-bold px-5 py-4 shadow-xl">
          {t("toastSent", { phone: masked })}
        </div>
      )}
    </div>
  );
}