import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, ALargeSmall, Volume2, VolumeX, Languages, User, Users, Eye, Bone, HeartPulse,
  Hospital, CalendarDays, Sun, Sunset, X, ChevronRight, ChevronLeft, Stethoscope, LogOut,
} from "lucide-react";
import { LANGUAGES, translate } from "./i18n";
import { speak, stopSpeaking } from "./voice";
import { focusRing, OptionCard, PrimaryButton, ErrorBanner } from "./ui";
import AuthScreen from "./AuthScreen";
import StepThreeReview from "./StepThreeReview";

const STORAGE_KEY = "opd_phone"; // "signed in" memory on this device (prototype only)
const readPhone = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
const savePhone = (p) => {
  try { p ? localStorage.setItem(STORAGE_KEY, p) : localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
};

const DEPARTMENTS = [
  { id: "eyes", icon: Eye },
  { id: "bones", icon: Bone },
  { id: "heart", icon: HeartPulse },
];

const HOSPITALS = [
  { id: "victoria", name: "Victoria Govt Hospital, Bengaluru", km: "2.4" },
  { id: "bowring", name: "Bowring Hospital, Bengaluru", km: "4.1" },
  { id: "kc", name: "KC General Hospital, Bengaluru", km: "6.3" },
];

// One doctor per department (fictional, for the demo)
const DOCTORS = [
  { id: "any" },
  { id: "ananya", name: "Dr. Ananya Rao", dept: "eyes", roleKey: "role_eyes", hours: "9 AM – 1 PM" },
  { id: "vikram", name: "Dr. Vikram Shetty", dept: "bones", roleKey: "role_bones", hours: "10 AM – 2 PM" },
  { id: "priya", name: "Dr. Priya Nair", dept: "heart", roleKey: "role_heart", hours: "9 AM – 4 PM" },
];

// Next 9 days starting today. Sundays are closed.
const DATES = Array.from({ length: 9 }, (_, i) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + i);
  const closed = d.getDay() === 0;
  return { id: String(i), date: d, closed, slots: closed ? 0 : 6 + ((d.getDate() * 7) % 15) };
});
const PAGE_SIZE = 3;
const TOTAL_PAGES = Math.ceil(DATES.length / PAGE_SIZE);

const TIMES = [
  { id: "morning", sub: "9:00 AM – 12:30 PM", start: "9:00 AM", icon: Sun },
  { id: "afternoon", sub: "2:00 PM – 4:00 PM", start: "2:00 PM", icon: Sunset },
];

function dateTitle(d, i, t, locale) {
  const md = d.date.toLocaleDateString(locale, { day: "numeric", month: "short" });
  if (i === 0) return `${t("today")}, ${md}`;
  if (i === 1) return `${t("tomorrow")}, ${md}`;
  return `${d.date.toLocaleDateString(locale, { weekday: "short" })}, ${md}`;
}

function LanguagePicker({ current, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FAF9F6] text-[#111827]">
      <div className="max-w-[430px] mx-auto p-4 space-y-4 pb-10">
        <div className="flex items-center gap-3 pt-4">
          <Languages size={40} aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold">Choose your language</h1>
            <p className="text-2xl font-bold">अपनी भाषा चुनें</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((l) => (
            <button key={l.code} type="button" lang={l.code} onClick={() => onPick(l.code)}
              className={`min-h-[84px] p-3 rounded-xl border-2 text-left ${focusRing}
                ${current === l.code ? "border-[#0B5ED7] bg-blue-50 ring-2 ring-[#0B5ED7]" : "border-[#111827] bg-white"}`}>
              <span className="block text-2xl font-bold">{l.native}</span>
              <span className="block text-base text-gray-700">{l.english}</span>
            </button>
          ))}
        </div>
        {onClose && (
          <button type="button" onClick={onClose}
            className={`w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold ${focusRing}`}>
            <X className="inline mr-1" size={24} aria-hidden="true" /> Close
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [langCode, setLangCode] = useState(null);
  const [showLang, setShowLang] = useState(false);
  const [screen, setScreen] = useState(null); // null | "auth" | "book"
  const [phone, setPhone] = useState(readPhone);
  const [voiceOn, setVoiceOn] = useState(true);
  const [step, setStep] = useState(1);
  const [largeText, setLargeText] = useState(false);
  const [patientType, setPatientType] = useState("self");
  const [otherName, setOtherName] = useState("");
  const [otherAge, setOtherAge] = useState("");
  const [department, setDepartment] = useState(null);
  const [hospital, setHospital] = useState(HOSPITALS[0]);
  const [showHospitals, setShowHospitals] = useState(false);
  const [dateIdx, setDateIdx] = useState(null);
  const [datePage, setDatePage] = useState(0);
  const [timeSlot, setTimeSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("any");
  const [error, setError] = useState("");
  const bannerRef = useRef(null);

  const lang = LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];
  const t = useCallback((key, vars) => translate(lang.code, key, vars), [lang.code]);
  const say = useCallback((text) => { if (voiceOn) speak(text, lang.locale); }, [voiceOn, lang.locale]);

  const date = dateIdx !== null ? DATES[dateIdx] : null;
  const doctor = DOCTORS.find((d) => d.id === selectedDoctor) || DOCTORS[0];
  const doctorName = doctor.id === "any" ? t("anyDoc") : doctor.name;
  const visibleDoctors = DOCTORS.filter((d) => !d.dept || d.dept === department?.id);
  const visibleDates = DATES.slice(datePage * PAGE_SIZE, datePage * PAGE_SIZE + PAGE_SIZE);
  const onLastPage = datePage === TOTAL_PAGES - 1;
  const nextOpenIdx = dateIdx !== null ? DATES.findIndex((x, i) => i > dateIdx && !x.closed) : -1;

  const patient =
    patientType === "self"
      ? { name: "Ramesh Sharma", age: 65 }
      : { name: otherName.trim(), age: otherAge };
  const maskedPhone = phone ? `${phone.slice(0, 2)}XXX XXXXX` : "";

  // A+ : every rem-based Tailwind size grows 25%
  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? "20px" : "16px";
  }, [largeText]);

  // voice reads the instruction every time a booking step opens
  useEffect(() => {
    if (screen !== "book") return;
    if (step === 1) say(t("vStep1"));
    if (step === 2) say(t("vStep2"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, step, langCode]);

  const fail = (msg) => {
    setError(msg);
    say(msg);
    requestAnimationFrame(() => {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus();
    });
  };
  const chose = (x) => say(t("vChose", { x }));

  const pickLanguage = (code) => {
    setLangCode(code);
    setShowLang(false);
    if (!screen) setScreen(phone ? "book" : "auth"); // already signed in -> straight to Screen 1
  };

  const toggleVoice = () => {
    if (voiceOn) stopSpeaking();
    setVoiceOn((v) => !v);
  };

  const onVerified = (p) => {
    savePhone(p);
    setPhone(p);
    setStep(1);
    setScreen("book");
  };

  const reset = () => {
    setStep(1); setPatientType("self"); setOtherName(""); setOtherAge("");
    setDepartment(null); setHospital(HOSPITALS[0]); setDateIdx(null); setDatePage(0);
    setTimeSlot(null); setSelectedDoctor("any"); setError("");
  };

  const signOut = () => {
    savePhone(null);
    setPhone(null);
    reset();
    setScreen("auth");
  };

  const goBack = () => { setError(""); setStep((s) => Math.max(1, s - 1)); };

  const choosePatient = (type) => { setPatientType(type); chose(type === "self" ? t("myself") : t("someone")); };

  const chooseDept = (d) => {
    setDepartment(d);
    setSelectedDoctor("any");
    setError("");
    chose(t(`d_${d.id}`));
  };

  const chooseDate = (i) => {
    setDateIdx(i);
    setTimeSlot(null);
    setError("");
    if (DATES[i].closed) say(t("sunTitle"));
    else chose(dateTitle(DATES[i], i, t, lang.locale));
  };

  const chooseTime = (tm) => { setTimeSlot(tm); setError(""); chose(`${t(tm.id)}, ${tm.sub}`); };
  const chooseDoctor = (d) => { setSelectedDoctor(d.id); chose(d.id === "any" ? t("anyDoc") : d.name); };
  const chooseHospital = (h) => { setHospital(h); setShowHospitals(false); chose(h.name); };

  const nextFromStep1 = () => {
    if (patientType === "other" && (!otherName.trim() || !otherAge)) return fail(t("errName"));
    if (!department) return fail(t("errDept"));
    setError(""); setStep(2);
  };

  const nextFromStep2 = () => {
    if (!date || date.closed) return fail(t("errDay"));
    if (!timeSlot) return fail(t("errTime"));
    setError(""); setStep(3);
  };

  return (
    <div className="max-w-[430px] min-h-screen mx-auto bg-[#FAF9F6] text-[#111827] shadow-xl text-lg">
      {(!langCode || showLang) && (
        <LanguagePicker current={langCode} onPick={pickLanguage} onClose={langCode ? () => setShowLang(false) : null} />
      )}

      {screen === "book" && (
        <header className="sticky top-0 z-20 bg-[#FAF9F6] border-b-2 border-[#111827] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            {step > 1 ? (
              <button type="button" onClick={goBack}
                className={`min-h-[56px] px-3 rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center gap-1 ${focusRing}`}>
                <ArrowLeft size={24} aria-hidden="true" /> {t("back")}
              </button>
            ) : (
              <span className="min-h-[56px] w-[88px]" />
            )}
            <p className="font-bold text-lg" aria-live="polite">{t("stepOf", { n: step })}</p>
          </div>
          <div className="h-2 rounded bg-gray-300" aria-hidden="true">
            <div className="h-2 rounded bg-[#0B5ED7] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </header>
      )}

      {screen && (
        <main className="p-4 space-y-4 pb-10">
          {/* Tools: bigger text, voice on/off, change language */}
          <div className="space-y-2">
            <button type="button" onClick={() => setLargeText((v) => !v)} aria-pressed={largeText}
              className={`w-full min-h-[56px] rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${focusRing}
                ${largeText ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#111827]"}`}>
              <ALargeSmall size={24} aria-hidden="true" /> {largeText ? t("bigTextOn") : t("bigText")}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={toggleVoice} aria-pressed={voiceOn}
                className={`min-h-[56px] rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${focusRing}
                  ${voiceOn ? "bg-[#0F5132] text-white border-[#0F5132]" : "bg-white border-[#111827]"}`}>
                {voiceOn ? <Volume2 size={24} aria-hidden="true" /> : <VolumeX size={24} aria-hidden="true" />}
                {voiceOn ? t("voiceOn") : t("voiceOff")}
              </button>
              <button type="button" onClick={() => setShowLang(true)}
                className={`min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center justify-center gap-2 ${focusRing}`}>
                <Languages size={24} aria-hidden="true" /> {t("changeLang")}
              </button>
            </div>
          </div>

          {screen === "auth" && <AuthScreen t={t} say={say} onVerified={onVerified} />}

          {screen === "book" && (
            <>
              <ErrorBanner message={error} bannerRef={bannerRef} />

              {step === 1 && (
                <>
                  {phone && (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl border-2 border-[#0F5132] bg-green-50">
                      <span className="font-bold">{t("welcomeBack", { phone: maskedPhone })}</span>
                      <button type="button" onClick={signOut}
                        className={`min-h-[56px] px-3 rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center gap-1 ${focusRing}`}>
                        <LogOut size={20} aria-hidden="true" /> {t("signOut")}
                      </button>
                    </div>
                  )}

                  <h1 className="text-2xl font-bold">{t("who")}</h1>
                  <div role="radiogroup" aria-label={t("who")} className="space-y-3">
                    <OptionCard selected={patientType === "self"} onClick={() => choosePatient("self")}
                      icon={User} title={t("myself")} sub={`Ramesh Sharma, 65 • ${t("abha")}`} />
                    <OptionCard selected={patientType === "other"} onClick={() => choosePatient("other")}
                      icon={Users} title={t("someone")} />
                  </div>

                  {patientType === "other" && (
                    <div className="space-y-3 p-4 rounded-xl border-2 border-[#111827] bg-white">
                      <label className="block font-bold">
                        {t("nameLabel")}
                        <input value={otherName} onChange={(e) => setOtherName(e.target.value)}
                          className={`mt-1 w-full min-h-[56px] px-3 rounded-lg border-2 border-[#111827] font-normal ${focusRing}`} />
                      </label>
                      <label className="block font-bold">
                        {t("ageLabel")}
                        <input inputMode="numeric" value={otherAge}
                          onChange={(e) => setOtherAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          className={`mt-1 w-full min-h-[56px] px-3 rounded-lg border-2 border-[#111827] font-normal ${focusRing}`} />
                      </label>
                    </div>
                  )}

                  <h2 className="text-2xl font-bold pt-2">{t("whichDept")}</h2>
                  <div role="radiogroup" aria-label={t("whichDept")} className="space-y-3">
                    {DEPARTMENTS.map((d) => (
                      <OptionCard key={d.id} selected={department?.id === d.id}
                        onClick={() => chooseDept(d)}
                        icon={d.icon} title={t(`d_${d.id}`)} sub={t(`d_${d.id}_desc`)} />
                    ))}
                  </div>
                  <PrimaryButton onClick={nextFromStep1}>
                    {t("nextDate")} <ChevronRight size={24} aria-hidden="true" />
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
                        <p className="text-base text-gray-700">{t("kmAway", { d: hospital.km })}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowHospitals(true)}
                      className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] text-[#0B5ED7] bg-white font-bold ${focusRing}`}>
                      {t("changeHospital")}
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold pt-2">{t("pickDay")}</h2>
                  <div role="radiogroup" aria-label={t("pickDay")} className="space-y-3">
                    {visibleDates.map((d) => {
                      const i = DATES.indexOf(d);
                      return (
                        <OptionCard key={d.id} selected={dateIdx === i} onClick={() => chooseDate(i)}
                          icon={CalendarDays} title={dateTitle(d, i, t, lang.locale)}
                          sub={d.closed ? t("closed") : t("slotsOpen", { n: d.slots })} />
                      );
                    })}
                  </div>

                  <button type="button" onClick={() => setDatePage((p) => (p + 1) % TOTAL_PAGES)}
                    className={`w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center justify-center gap-2 ${focusRing}`}>
                    {onLastPage
                      ? <><ChevronLeft size={24} aria-hidden="true" /> {t("backToday")}</>
                      : <>{t("checkNext")} <ChevronRight size={24} aria-hidden="true" /></>}
                  </button>

                  {date?.closed && (
                    <div className="p-4 rounded-xl border-2 border-amber-700 bg-amber-50 space-y-3">
                      <p className="font-bold text-xl">{t("sunTitle")}</p>
                      <p>{t("sunDesc")}</p>
                      {nextOpenIdx >= 0 && (
                        <PrimaryButton onClick={() => { chooseDate(nextOpenIdx); setDatePage(Math.floor(nextOpenIdx / PAGE_SIZE)); }}>
                          {t("sunPick", { d: dateTitle(DATES[nextOpenIdx], nextOpenIdx, t, lang.locale) })}
                        </PrimaryButton>
                      )}
                    </div>
                  )}

                  {date && !date.closed && (
                    <>
                      <h2 className="text-2xl font-bold pt-2">{t("pickTime")}</h2>
                      <div role="radiogroup" aria-label={t("pickTime")} className="space-y-3">
                        {TIMES.map((tm) => (
                          <OptionCard key={tm.id} selected={timeSlot?.id === tm.id}
                            onClick={() => chooseTime(tm)} icon={tm.icon} title={t(tm.id)} sub={tm.sub} />
                        ))}
                      </div>
                    </>
                  )}

                  <h2 className="text-2xl font-bold pt-2">{t("whichDoctor")}</h2>
                  <div role="radiogroup" aria-label={t("whichDoctor")} className="grid grid-cols-2 gap-3">
                    {visibleDoctors.map((d) => {
                      const on = selectedDoctor === d.id;
                      return (
                        <button key={d.id} type="button" role="radio" aria-checked={on}
                          onClick={() => chooseDoctor(d)}
                          className={`min-h-[150px] text-left p-3 rounded-xl border-2 flex flex-col gap-1 ${focusRing}
                            ${on ? "border-[#0F5132] bg-green-50 ring-2 ring-[#0F5132]" : "border-[#111827] bg-white"}`}>
                          <Stethoscope size={28} aria-hidden="true" />
                          <span className="font-bold text-lg leading-snug">{d.id === "any" ? t("anyDoc") : d.name}</span>
                          {d.roleKey && <span className="text-base text-gray-700">{t(d.roleKey)}</span>}
                          <span className="text-base font-bold text-[#0F5132] mt-auto">
                            {d.id === "any" ? t("fastest") : t("avail", { h: d.hours })}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <PrimaryButton onClick={nextFromStep2}>
                    {t("nextReview")} <ChevronRight size={24} aria-hidden="true" />
                  </PrimaryButton>
                </>
              )}

              {step === 3 && (
                <StepThreeReview
                  t={t}
                  say={say}
                  phone={phone || ""}
                  patient={patient}
                  deptLabel={t(`d_${department.id}`)}
                  doctorName={doctorName}
                  dateLabel={dateTitle(date, dateIdx, t, lang.locale)}
                  timeLabel={`${t(timeSlot.id)} (${timeSlot.start})`}
                  hospital={hospital}
                  onReset={reset}
                />
              )}
            </>
          )}
        </main>
      )}

      {/* Change-hospital drawer */}
      {showHospitals && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={t("changeHospital")}>
          <div className="w-full max-w-[430px] bg-[#FAF9F6] rounded-t-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t("changeHospital")}</h2>
              <button type="button" onClick={() => setShowHospitals(false)} aria-label="Close"
                className={`min-h-[56px] px-3 rounded-xl border-2 border-[#111827] bg-white font-bold flex items-center gap-1 ${focusRing}`}>
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            {HOSPITALS.map((h) => (
              <OptionCard key={h.id} selected={hospital.id === h.id}
                onClick={() => chooseHospital(h)}
                icon={Hospital} title={h.name} sub={t("kmAway", { d: h.km })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}