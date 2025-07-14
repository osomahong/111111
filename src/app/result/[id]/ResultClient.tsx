"use client";
import PhoneFrame from "../../../components/PhoneFrame";
import { useEffect, useState, useRef } from "react";

function StatusBar() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex justify-between items-center px-5 pt-4 pb-2 text-xs sm:text-sm font-semibold text-[#1c1c1e]">
      <span className="time">{time}</span>
      <div className="flex items-center gap-2">
        <span>LTE</span>
        {/* Wi-Fi Icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
        {/* Battery Icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20,10V8.3C20,7.6,19.4,7,18.7,7H3.3C2.6,7,2,7.6,2,8.3v7.3C2,16.4,2.6,17,3.3,17h15.3c0.7,0,1.3-0.6,1.3-1.3V14h2v-4H20z"></path></svg>
      </div>
    </div>
  );
}

function MailHeader({ onBack }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-[#f0f0f0]">
      <button
        className="bg-none border-none p-1 text-[#007aff] hover:bg-[#e6f0ff] active:bg-[#d0e7ff] rounded"
        onClick={onBack}
        aria-label="뒤로가기"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <div className="flex gap-3">
        <button className="p-1"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8a8a8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
    </div>
  );
}

// 안전하게 origin 결정
const getOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://111111-pi.vercel.app";
};

export default function ResultClient({ id, subject, sender, receiver, translatedText }) {
  const frameRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    // 환경변수 기반으로 이미지 서버 주소 결정
    const captureServer = process.env.NEXT_PUBLIC_CAPTURE_SERVER_URL || "https://oow7izfiyiwfutsa.public.blob.vercel-storage.com";
    const imageUrl = `${captureServer}/images/${id}.png`;
    const resultUrl = `${getOrigin()}/result/${id}`;
    const checkAndCreateImage = async () => {
      try {
        console.log("[이미지 체크] id:", id, "imageUrl:", imageUrl);
        const res = await fetch(imageUrl, { method: "HEAD" });
        console.log("[이미지 HEAD 결과]", res.status);
        if (res.status === 404) {
          console.log("[이미지 없음, 생성 요청]", resultUrl);
          // Blob Storage에 업로드 요청 (capture-server가 Blob Storage로 업로드하도록 구현 필요)
          await fetch(`/api/capture-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: resultUrl, id }),
          });
        }
      } catch (e) {
        console.error("[이미지 생성 에러]", e);
      }
    };
    checkAndCreateImage();
  }, [id]);
  // 뒤로가기 등 클라이언트 전용 로직 필요시 추가
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center" style={{background: "linear-gradient(180deg, #FF7AC3 0%, #A259F7 100%)"}}>
      <div className="flex flex-col items-center justify-center flex-1 grow">
        <PhoneFrame ref={frameRef} id="phone-frame">
          <div className="flex flex-col h-full">
            <StatusBar />
            <MailHeader onBack={() => window.location.href = '/'} />
            <div className="flex-1 flex flex-col overflow-y-auto max-h-[500px]">
              <div className="px-5 py-4">
                <h1 className="text-lg font-semibold mb-3">{subject}</h1>
                <div className="flex items-center mb-5">
                  <div className="w-10 h-10 bg-[#e5e5ea] rounded-full flex items-center justify-center font-bold text-[#8a8a8e] mr-3">{sender?.avatar}</div>
                  <div>
                    <div className="font-semibold">{sender?.name}</div>
                    <div className="text-xs text-[#8a8a8e]">{sender?.email}</div>
                  </div>
                </div>
                <div className="text-sm text-[#333] leading-relaxed space-y-2">
                  {translatedText?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
} 