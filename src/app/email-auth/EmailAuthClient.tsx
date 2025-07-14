"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhoneFrame from "../../components/PhoneFrame";

const allowedDomains = [
  "gmail.com",
  "naver.com",
  "hanmail.net",
  "daum.net",
];
const emailRegex = /^[\w-.]+@([\w-]+\.)?(gmail\.com|naver\.com|hanmail\.net|daum\.net)$/;

function getNow() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
function getToday() {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function EmailAuthClient() {
  const [now, setNow] = useState(getNow());
  const [today, setToday] = useState(getToday());
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getNow());
      setToday(getToday());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email)) {
      setError("지원하는 이메일 도메인만 입력 가능합니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "서버 오류가 발생했습니다.");
        setLoading(false);
        return;
      }
      if (typeof window !== 'undefined') {
        const w = window as any;
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({ event: 'auth_complete' });
      }
      localStorage.setItem("email-auth-ok", "1");
      router.replace("/info");
    } catch (e) {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{background: "linear-gradient(180deg, #FF7AC3 0%, #A259F7 100%)"}}>
      <PhoneFrame innerBgImageUrl="/assets/frame-bg.jpg">
        {/* 어두운 블러 오버레이 */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] z-0" />
        {/* 주요 UI */}
        <div className="flex flex-col items-center justify-start h-full w-full px-6 py-10 relative">
          <div className="w-full flex flex-col items-center justify-center md:w-auto md:flex md:flex-col md:items-center mt-6">
            <div className="text-sm font-medium text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] mb-2 md:text-center">{today}</div>
            <div className="font-bebas text-7xl font-black tracking-widest mb-4 md:text-center text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">{now}</div>
            <form className="w-full max-w-xs mb-8" onSubmit={handleSubmit} autoComplete="off">
              <div className="mt-10 mb-0 text-base font-semibold text-white text-center drop-shadow">이메일 주소를 입력하세요</div>
              <div className="mb-4 text-red-300 text-center opacity-80" style={{ fontSize: '10px' }}>*이메일은 개인정보이므로 저장되지 않습니다.</div>
              <input
                type="email"
                className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/30 text-lg text-white text-center placeholder:text-white/70 drop-shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                placeholder="•••••@gmail.com"
                value={email}
                onChange={handleChange}
                disabled={loading}
                autoFocus
                style={{fontWeight:500}}
              />
              {error && <div className="text-red-400 text-sm text-center mt-3 font-bold drop-shadow">{error}</div>}
              <button
                type="submit"
                className="mt-6 w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-400 transition-colors drop-shadow"
                disabled={loading || !email}
              >
                {loading ? "확인 중..." : "다음"}
              </button>
            </form>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
} 