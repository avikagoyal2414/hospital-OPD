import { useState, useRef, useEffect } from "react";
import { Smartphone, MessageSquare, ChevronRight } from "lucide-react";
import { PrimaryButton, ErrorBanner, focusRing } from "./ui";

const OTP_LIFETIME_MS = 2 * 60 * 1000; // OTP works for 2 minutes
const MAX_TRIES = 3;                   // then a new OTP is needed
const RESEND_SECONDS = 30;

// 4-digit OTP from the browser's secure random generator
const makeOtp = () => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 10000).padStart(4, "0");
};

export default function AuthScreen({ t, say, onVerified }) {
  const [mode, setMode] = useState("intro"); // intro | phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [sms, setSms] = useState(null); // demo "SMS arrived" banner
  const session = useRef(null);         // { code, exp, tries }
  const bannerRef = useRef(null);

  const fail = (msg) => {
    setError(msg);
    say(msg);
    requestAnimationFrame(() => {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus();
    });
  };

  // read out the instruction for intro and phone screens
  useEffect(() => {
    if (mode === "intro") say(t("vWelcome"));
    if (mode === "phone") say(t("vPhone"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // after an OTP is sent: "SMS" arrives, then the code autofills
  useEffect(() => {
    if (mode !== "otp" || !session.current) return;
    const code = session.current.code;
    const showSms = setTimeout(() => setSms(code), 1500);
    const autofill = setTimeout(() => { setOtp(code); setSms(null); }, 2800);
    // On a real phone + real SMS backend, Chrome can autofill from the SMS itself
    let ac;
    if ("OTPCredential" in window) {
      ac = new AbortController();
      navigator.credentials
        .get({ otp: { transport: ["sms"] }, signal: ac.signal })
        .then((c) => c?.code && setOtp(c.code))
        .catch(() => {});
    }
    return () => { clearTimeout(showSms); clearTimeout(autofill); ac?.abort(); };
  }, [mode, sentCount]);

  // resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return fail(t("errPhone"));
    setError("");
    session.current = { code: makeOtp(), exp: Date.now() + OTP_LIFETIME_MS, tries: MAX_TRIES };
    setOtp("");
    setSms(null);
    setCooldown(RESEND_SECONDS);
    setSentCount((n) => n + 1);
    setMode("otp");
    say(t("vOtp"));
  };

  const verify = () => {
    const s = session.current;
    if (!s || Date.now() > s.exp || s.tries <= 0) return fail(t("errOtpExpired"));
    if (otp === s.code) {
      session.current = null; // OTP can only be used once
      setError("");
      onVerified(phone);
      return;
    }
    s.tries -= 1;
    setOtp("");
    fail(s.tries > 0 ? t("errOtp", { n: s.tries }) : t("errOtpExpired"));
  };

  return (
    <div className="space-y-4">
      {sms && (
        <div role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px] flex items-start gap-3 rounded-xl bg-[#111827] text-white p-4 shadow-xl">
          <MessageSquare className="shrink-0" size={28} aria-hidden="true" />
          <span className="font-bold">{t("sms", { otp: sms })}</span>
        </div>
      )}

      <ErrorBanner message={error} bannerRef={bannerRef} />

      {mode === "intro" && (
        <div className="space-y-4 pt-4">
          <Smartphone size={48} aria-hidden="true" />
          <h1 className="text-3xl font-bold">{t("welcome")}</h1>
          <p>{t("welcomeSub")}</p>
          <PrimaryButton onClick={() => setMode("phone")}>{t("signUp")}</PrimaryButton>
        </div>
      )}

      {mode === "phone" && (
        <form onSubmit={(e) => { e.preventDefault(); sendOtp(); }} className="space-y-4 pt-2">
          <label className="block font-bold text-xl">
            {t("phoneLabel")}
            <div className="mt-2 flex gap-2">
              <span className="min-h-[56px] px-3 flex items-center rounded-lg border-2 border-[#111827] bg-white font-bold">+91</span>
              <input
                type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={`flex-1 min-w-0 min-h-[56px] px-3 rounded-lg border-2 border-[#111827] bg-white text-2xl tracking-widest font-normal ${focusRing}`}
              />
            </div>
          </label>
          <PrimaryButton type="submit">{t("sendOtp")} <ChevronRight size={24} aria-hidden="true" /></PrimaryButton>
        </form>
      )}

      {mode === "otp" && (
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-4 pt-2">
          <h1 className="text-2xl font-bold">{t("otpTitle")}</h1>
          <p className="font-bold">{t("otpSentTo", { phone })}</p>
          <button type="button" onClick={() => { setMode("phone"); setOtp(""); setSms(null); }}
            className={`w-full min-h-[56px] rounded-xl border-2 border-[#111827] bg-white font-bold ${focusRing}`}>
            {t("changeNumber")}
          </button>
          <input
            type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4}
            value={otp} aria-label={t("otpTitle")}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={`w-full min-h-[72px] text-center text-4xl font-bold tracking-[0.6em] rounded-xl border-2 border-[#111827] bg-white ${focusRing}`}
          />
          {otp.length < 4 && <p className="text-center text-gray-700">{t("otpReading")}</p>}
          <PrimaryButton type="submit" disabled={otp.length !== 4}>{t("verify")}</PrimaryButton>
          <button type="button" disabled={cooldown > 0} onClick={sendOtp}
            className={`w-full min-h-[56px] rounded-xl border-2 border-[#0B5ED7] text-[#0B5ED7] bg-white font-bold disabled:opacity-50 ${focusRing}`}>
            {cooldown > 0 ? t("resendIn", { s: cooldown }) : t("resend")}
          </button>
        </form>
      )}
    </div>
  );
}