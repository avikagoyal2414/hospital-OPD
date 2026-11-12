import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, ALargeSmall, User, Users, Eye, Bone, HeartPulse, Hospital,
  CalendarDays, Sun, Sunset, AlertTriangle, CheckCircle2, X, ChevronRight,
  ChevronLeft, Stethoscope,
} from "lucide-react";
import StepThreeReview from "./StepThreeReview";

const DEPARTMENTS = [
  { id: "eyes", title: "Eye & Vision (Ophthalmology)", short: "Eye & Vision", desc: "Blurry vision, eye pain, glasses check", icon: Eye },
  { id: "bones", title: "Bones & Joints (Orthopedics)", short: "Bones & Joints", desc: "Knee, back or joint pain, fractures", icon: Bone },
  { id: "heart", title: "Heart, BP & Fever (General Medicine)", short: "Heart, BP & Fever", desc: "Blood pressure, sugar, fever, general check-up", icon: HeartPulse },
];

const HOSPITALS = [
  { id: "victoria", name: "Victoria Govt Hospital, Bengaluru", dist: "2.4 km away" },
  { id: "bowring", name: "Bowring Hospital, Bengaluru", dist: "4.1 km away" },
  { id: "kc", name: "KC General Hospital, Bengaluru", dist: "6.3 km away" },
];

// Today = Thu 12 Nov 2026. 9 days, shown 3 at a time.
const DATES = [
  { id: "12", title: "Today, 12 Nov", short: "Thu, 12 Nov", sub: "6 slots open", closed: false },
  { id: "13", title: "Tomorrow, 13 Nov", short: "Fri, 13 Nov", sub: "14 slots open", closed: false },
  { id: "14", title: "Sat, 14 Nov", short: "Sat, 14 Nov", sub: "8 slots open", closed: false },
  { id: "15", title: "Sun, 15 Nov", short: "Sun, 15 Nov", sub: "Closed", closed: true },
  { id: "16", title: "Mon, 16 Nov", short: "Mon, 16 Nov", sub: "20 slots open", closed: false },
  { id: "17", title: "Tue, 17 Nov", short: "Tue, 17 Nov", sub: "18 slots open", closed: false },
  { id: "18", title: "Wed, 18 Nov", short: "Wed, 18 Nov", sub: "16 slots open", closed: false },
  { id: "19", title: "Thu, 19 Nov", short: "Thu, 19 Nov", sub: "12 slots open", closed: false },
  { id: "20", title: "Fri, 20 Nov", short: "Fri, 20 Nov", sub: "10 slots open", closed: false },
];
const PAGE_SIZE = 3;
const TOTAL_PAGES = Math.ceil(DATES.length / PAGE_SIZE);

const TIMES = [
  { id: "morning", label: "Morning", sub: "9:00 AM – 12:30 PM", start: "9:00 AM", icon: Sun },
  { id: "afternoon", label: "Afternoon", sub: "2:00 PM – 4:00 PM", start: "2:00 PM", icon: Sunset },
];

const DOCTORS = [
  { id: "any", name: "Any Available Doctor", role: "Shortest waiting time", tag: "FASTEST" },
  { id: "ananya", name: "Dr. Ananya Rao", role: "Senior Eye Specialist", hours: "Available 9 AM – 1 PM", eyesOnly: true },
];

const focusRing =
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5ED7] focus-visible:ring-offset-2";

function OptionCard({ selected, onClick, icon: Icon, title, sub }) {
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

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] bg-[#0B5ED7] text-white font-bold text-lg
        flex items-center justify-center gap-2 ${focusRing}`}
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
  const [datePage, setDatePage] = useState(0);
  const [timeSlot, setTimeSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("any");
  const [error, setError] = useState("");
  const bannerRef = useRef(null);

  // A+ : every rem-based Tailwind size grows 25%
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

  const doctor = DOCTORS.find((d) => d.id === selectedDoctor) || DOCTORS[0];
  const visibleDoctors = DOCTORS.filter((d) => !d.eyesOnly || department?.id === "eyes");
  const visibleDates = DATES.slice(datePage * PAGE_SIZE, datePage * PAGE_SIZE + PAGE_SIZE);
  const onLastPage = datePage === TOTAL_PAGES - 1;

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
    setDepartment(null); setHospital(HOSPITALS[0]); setDate(null); setDatePage(0);
    setTimeSlot(null); setSelectedDoctor("any"); setError("");
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
        <button type="button" onClick={() => setLargeText((v) => !v)} aria-pressed={largeText}
          className={`w-full min-h-[56px] rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${focusRing}
            ${largeText ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#111827]"}`}>
          <ALargeSmall size={24} aria-hidden="true" /> {largeText ? "A+ On" : "A+ Bigger Text"}
        </button>
        <div className="h-2 rounded bg-gray-300" aria-hidden="true">
          <div className="h-2 rounded bg-[#0B5ED7] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </header>

      <main className="p-4 space-y-4 pb-10">
        <ErrorBanner message={error} bannerRef={bannerRef} />

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold">Who is this for?</h1>
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
                  onClick={() => {
                    setDepartment(d);
                    if (d.id !== "eyes") setSelectedDoctor("any");
                    setError("");
                  }}
                  icon={d.icon} title={d.title} sub={d.desc} />
              ))}
            </div>
            <PrimaryButton onClick={nextFromStep1}>
              Next: Choose Day &amp; Time <ChevronRight size={24} aria-hidden="true" />
            </PrimaryButton>
          </>
        )}

        {step === 2 && (
          <>
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

            <h2 className="text-2xl font-bold pt-2">Pick a visit day</h2>
            <div role="radiogroup" aria-label="Date" className="space-y-3">
              {visibleDates.map((d) => (
                <OptionCard key={d.id} selected={date?.id === d.id}
                  onClick={() => { setDate(d); setTimeSlot(null); setError(""); }}
                  icon={CalendarDays} title={d.title} sub={d.sub} />
              ))}
            </div>

            <button type="button" onClick={() => setDatePage((p) => (p + 1) % TOTAL_PAGES)}
              className={`w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center justify-center gap-2 ${focusRing}`}>
              {onLastPage ? (
                <><ChevronLeft size={24} aria-hidden="true" /> Back to today</>
              ) : (
                <>Check next 3 days <ChevronRight size={24} aria-hidden="true" /></>
              )}
            </button>

            {date?.closed && (
              <div className="p-4 rounded-xl border-2 border-amber-700 bg-amber-50 space-y-3">
                <p className="font-bold text-xl">OPD is closed on Sundays</p>
                <p>The hospital has no doctors in OPD on this day. Please pick another day.</p>
                <PrimaryButton onClick={() => { setDate(DATES[4]); setDatePage(1); setTimeSlot(null); setError(""); }}>
                  Select Monday (16 Nov) Instead
                </PrimaryButton>
              </div>
            )}

            {date && !date.closed && (
              <>
                <h2 className="text-2xl font-bold pt-2">Pick a time slot</h2>
                <div role="radiogroup" aria-label="Time" className="space-y-3">
                  {TIMES.map((t) => (
                    <OptionCard key={t.id} selected={timeSlot?.id === t.id}
                      onClick={() => { setTimeSlot(t); setError(""); }}
                      icon={t.icon} title={`${t.label} Slot`} sub={t.sub} />
                  ))}
                </div>
              </>
            )}

            <h2 className="text-2xl font-bold pt-2">Which Doctor?</h2>
            <div role="radiogroup" aria-label="Doctor" className="grid grid-cols-2 gap-3">
              {visibleDoctors.map((d) => {
                const on = selectedDoctor === d.id;
                return (
                  <button key={d.id} type="button" role="radio" aria-checked={on}
                    onClick={() => setSelectedDoctor(d.id)}
                    className={`min-h-[150px] text-left p-3 rounded-xl border-2 flex flex-col gap-1 ${focusRing}
                      ${on ? "border-[#0F5132] bg-green-50 ring-2 ring-[#0F5132]" : "border-[#111827] bg-white"}`}>
                    <Stethoscope size={28} aria-hidden="true" />
                    <span className="font-bold text-lg leading-snug">{d.name}</span>
                    <span className="text-base text-gray-700">{d.role}</span>
                    {d.tag && <span className="text-base font-bold text-[#0F5132] mt-auto">{d.tag}</span>}
                    {d.hours && <span className="text-base font-bold text-[#0F5132] mt-auto">{d.hours}</span>}
                  </button>
                );
              })}
            </div>

            <PrimaryButton onClick={nextFromStep2}>
              Next: Review Booking <ChevronRight size={24} aria-hidden="true" />
            </PrimaryButton>
          </>
        )}

        {step === 3 && (
          <StepThreeReview
            patient={patient}
            department={department}
            hospital={hospital}
            date={date}
            timeSlot={timeSlot}
            doctor={doctor}
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
  );
}