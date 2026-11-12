import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Volume2, ALargeSmall, User, Users, Eye, Bone, HeartPulse,
  Hospital, CalendarDays, Sun, Sunset, AlertTriangle, CheckCircle2, X, ChevronRight,
} from "lucide-react";
import StepThreeReview from "./StepThreeReview";

const DEPARTMENTS = [
  { id: "eyes", title: "Eyes (Ophthalmology)", desc: "Blurry vision, eye pain, glasses check", icon: Eye },
  { id: "bones", title: "Bones & Joints (Orthopedics)", desc: "Knee, back or joint pain, fractures", icon: Bone },
  { id: "heart", title: "Heart & BP (General Medicine)", desc: "Blood pressure, sugar, fever, general check-up", icon: HeartPulse },
];

const HOSPITALS = [
  { id: "victoria", name: "Victoria Govt Hospital, Bengaluru", dist: "2.4 km away" },
  { id: "bowring", name: "Bowring Hospital, Bengaluru", dist: "4.1 km away" },
  { id: "kc", name: "KC General Hospital, Bengaluru", dist: "6.3 km away" },
];

const DATES = [
  { id: "13", label: "Tomorrow, 13 Nov", sub: "14 slots open", closed: false },
  { id: "14", label: "Sat, 14 Nov", sub: "8 slots open", closed: false },
  { id: "15", label: "Sun, 15 Nov", sub: "Closed", closed: true },
];

const TIMES = [
  { id: "morning", label: "Morning", sub: "9:00 AM – 12:00 PM", icon: Sun },
  { id: "afternoon", label: "Afternoon", sub: "2:00 PM – 4:00 PM", icon: Sunset },
];

const focusRing =
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5ED7] focus-visible:ring-offset-2";

function OptionCard({ selected, onClick, icon: Icon, title, sub, disabled }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full min-h-[56px] text-left flex items-center gap-3 p-4 rounded-xl border-2 ${focusRing}
        ${selected ? "border-[#0B5ED7] bg-blue-50 ring-2 ring-[#0B5ED7]" : "border-[#111827] bg-white"}
        ${disabled ? "opacity-80" : ""}`}
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

function PrimaryButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] bg-[#0B5ED7] text-white font-bold text-lg
        flex items-center justify-center gap-2 ${focusRing} ${className}`}
    >
      {children}
    </button>
  );
}

function ErrorBanner({ message, bannerRef }) {
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

export default function App() {
  const [step, setStep] = useState(1);
  const [largeText, setLargeText] = useState(false);
  const [patientType, setPatientType] = useState("self");
  const [otherName, setOtherName] = useState("");
  const [otherAge, setOtherAge] = useState("");
  const [department, setDepartment] = useState(null);
  const [hospital, setHospital] = useState(HOSPITALS[0]);
  const [showHospitals, setShowHospitals] = useState(false);
  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState(null);
  const [error, setError] = useState("");
  const bannerRef = useRef(null);

  // +25% text: every rem-based Tailwind size scales with the root font size
  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? "20px" : "16px";
  }, [largeText]);

  // jump to the error banner whenever one appears
  useEffect(() => {
    if (error && bannerRef.current) {
      bannerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current.focus();
    }
  }, [error]);

  const patient =
    patientType === "self"
      ? { name: "Ramesh Sharma", age: 65, abha: true }
      : { name: otherName.trim(), age: otherAge, abha: false };

  const listen = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text =
      step === 1
        ? "Step 1 of 3. Who is the appointment for? Choose Myself or Someone Else. Then tap one department: Eyes, Bones and Joints, or Heart and B P. Then press Next."
        : step === 2
        ? `Step 2 of 3. Your hospital is ${hospital.name}. Tap one day, then tap Morning or Afternoon. Then press Next: Review Booking.`
        : "Step 3 of 3. Check your appointment details. Then press Confirm OPD Appointment.";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const goBack = () => { setError(""); setStep((s) => Math.max(1, s - 1)); };

  const nextFromStep1 = () => {
    if (patientType === "other" && (!otherName.trim() || !otherAge)) {
      return setError("Please type the patient's name and age before continuing");
    }
    if (!department) return setError("Please tap one department above before continuing");
    setError(""); setStep(2);
  };

  const nextFromStep2 = () => {
    if (!date || date.closed) return setError("Please tap one open day above before continuing");
    if (!timeSlot) return setError("Please tap Morning or Afternoon before continuing");
    setError(""); setStep(3);
  };

  const reset = () => {
    setStep(1); setPatientType("self"); setOtherName(""); setOtherAge("");
    setDepartment(null); setHospital(HOSPITALS[0]); setDate(null); setTimeSlot(null); setError("");
  };

  return (
    <div className="max-w-[430px] min-h-screen mx-auto bg-[#FAF9F6] text-[#111827] shadow-xl text-lg">
      {/* Persistent top bar */}
      <header className="sticky top-0 z-20 bg-[#FAF9F6] border-b-2 border-[#111827] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {step > 1 ? (
            <button type="button" onClick={goBack}
              className={`min-h-[56px] px-3 rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center gap-1 ${focusRing}`}>
              <ArrowLeft size={24} aria-hidden="true" /> Back
            </button>
          ) : (
            <span className="min-h-[56px] w-[88px]" />
          )}
          <p className="font-bold text-lg" aria-live="polite">Step {step} of 3</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={listen}
            className={`flex-1 min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center justify-center gap-2 ${focusRing}`}>
            <Volume2 size={24} aria-hidden="true" /> Listen
          </button>
          <button type="button" onClick={() => setLargeText((v) => !v)} aria-pressed={largeText}
            className={`flex-1 min-h-[56px] rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${focusRing}
              ${largeText ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#111827]"}`}>
            <ALargeSmall size={24} aria-hidden="true" /> {largeText ? "A+ On" : "A+ Bigger Text"}
          </button>
        </div>
        <div className="h-2 rounded bg-gray-300" aria-hidden="true">
          <div className="h-2 rounded bg-[#0B5ED7] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </header>

      <main className="p-4 space-y-4 pb-10">
        <ErrorBanner message={error} bannerRef={bannerRef} />

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold">Who is the appointment for?</h1>
            <div role="radiogroup" aria-label="Patient" className="space-y-3">
              <OptionCard selected={patientType === "self"} onClick={() => setPatientType("self")}
                icon={User} title="Myself" sub="Ramesh Sharma, 65 • ABHA Linked" />
              <OptionCard selected={patientType === "other"} onClick={() => setPatientType("other")}
                icon={Users} title="Someone Else" />
            </div>

            {patientType === "other" && (
              <div className="space-y-3 p-4 rounded-xl border-2 border-[#111827] bg-white">
                <label className="block font-bold">
                  Patient's full name
                  <input value={otherName} onChange={(e) => setOtherName(e.target.value)}
                    className={`mt-1 w-full min-h-[56px] px-3 rounded-lg border-2 border-[#111827] font-normal ${focusRing}`} />
                </label>
                <label className="block font-bold">
                  Age
                  <input inputMode="numeric" value={otherAge}
                    onChange={(e) => setOtherAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className={`mt-1 w-full min-h-[56px] px-3 rounded-lg border-2 border-[#111827] font-normal ${focusRing}`} />
                </label>
              </div>
            )}

            <h2 className="text-2xl font-bold pt-2">Which doctor do you need?</h2>
            <div role="radiogroup" aria-label="Department" className="space-y-3">
              {DEPARTMENTS.map((d) => (
                <OptionCard key={d.id} selected={department?.id === d.id}
                  onClick={() => { setDepartment(d); setError(""); }}
                  icon={d.icon} title={d.title} sub={d.desc} />
              ))}
            </div>
            <PrimaryButton onClick={nextFromStep1}>Next: Choose Date <ChevronRight size={24} aria-hidden="true" /></PrimaryButton>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold">Where and when?</h1>
            <div className="p-4 rounded-xl border-2 border-[#111827] bg-white space-y-3">
              <div className="flex items-start gap-3">
                <Hospital size={28} className="shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold text-lg">{hospital.name}</p>
                  <p className="text-base text-gray-700">{hospital.dist}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowHospitals(true)}
                className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] text-[#0B5ED7] bg-white font-bold ${focusRing}`}>
                Change Hospital
              </button>
            </div>

            <h2 className="text-2xl font-bold pt-2">Pick a day</h2>
            <div role="radiogroup" aria-label="Date" className="space-y-3">
              {DATES.map((d) => (
                <OptionCard key={d.id} selected={date?.id === d.id}
                  onClick={() => { setDate(d); setTimeSlot(null); setError(""); }}
                  icon={CalendarDays} title={d.label} sub={d.sub} />
              ))}
            </div>

            {date?.closed && (
              <div className="p-4 rounded-xl border-2 border-amber-700 bg-amber-50 space-y-3">
                <p className="font-bold text-xl">OPD is closed on Sundays</p>
                <p>The hospital has no doctors in OPD today. Please pick another day.</p>
                <PrimaryButton onClick={() => { setDate(DATES[0]); setError(""); }}>
                  Select Tomorrow (13 Nov) Instead
                </PrimaryButton>
              </div>
            )}

            {date && !date.closed && (
              <>
                <h2 className="text-2xl font-bold pt-2">Pick a time</h2>
                <div role="radiogroup" aria-label="Time" className="space-y-3">
                  {TIMES.map((t) => (
                    <OptionCard key={t.id} selected={timeSlot?.id === t.id}
                      onClick={() => { setTimeSlot(t); setError(""); }}
                      icon={t.icon} title={t.label} sub={t.sub} />
                  ))}
                </div>
              </>
            )}
            <PrimaryButton onClick={nextFromStep2}>Next: Review Booking <ChevronRight size={24} aria-hidden="true" /></PrimaryButton>
          </>
        )}

        {step === 3 && (
          <StepThreeReview
            patient={patient}
            department={department}
            hospital={hospital}
            date={date}
            timeSlot={timeSlot}
            onBack={goBack}
            onReset={reset}
            isLargeText={largeText}
          />
        )}
      </main>

      {/* Change-hospital drawer */}
      {showHospitals && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Choose hospital">
          <div className="w-full max-w-[430px] bg-[#FAF9F6] rounded-t-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Choose a hospital</h2>
              <button type="button" onClick={() => setShowHospitals(false)} aria-label="Close"
                className={`min-h-[56px] px-3 rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center gap-1 ${focusRing}`}>
                <X size={24} aria-hidden="true" /> Close
              </button>
            </div>
            {HOSPITALS.map((h) => (
              <OptionCard key={h.id} selected={hospital.id === h.id}
                onClick={() => { setHospital(h); setShowHospitals(false); }}
                icon={Hospital} title={h.name} sub={h.dist} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}