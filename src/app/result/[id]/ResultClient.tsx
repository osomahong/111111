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

function MailHeader({ onBack, showOriginal, setShowOriginal, sender, id, translatedText, originalText }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-[#f0f0f0]">
      <button
        className="bg-none border-none p-1 text-[#007aff] hover:bg-[#e6f0ff] active:bg-[#d0e7ff] rounded"
        onClick={onBack}
        aria-label="뒤로가기"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button
        className="px-3 py-1 rounded bg-[#007aff] text-white text-xs font-semibold hover:bg-[#005fcc] transition-colors"
        onClick={() => {
          if (!showOriginal) {
            // 원문보기 버튼 클릭
            if (typeof window !== 'undefined') {
              const w = window as any;
              w.dataLayer = w.dataLayer || [];
              w.dataLayer.push({
                event: 'click_result_origin_btn',
                sender: sender?.name || '',
                result_id: id,
                real_content: (translatedText || '').replace(/\n/g, ' ').slice(0, 80)
              });
            }
          } else {
            // 속마음 보기 버튼 클릭
            if (typeof window !== 'undefined') {
              const w = window as any;
              w.dataLayer = w.dataLayer || [];
              w.dataLayer.push({
                event: 'click_result_real_btn',
                sender: sender?.name || '',
                result_id: id,
                origin_content: (originalText || '').replace(/\n/g, ' ').slice(0, 80)
              });
            }
          }
          setShowOriginal((v) => !v);
        }}
      >
        {showOriginal ? '속마음 보기' : '원문보기'}
      </button>
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

interface ResultClientProps {
  id: string;
  subject: string;
  sender: any;
  receiver: any;
  translatedText: string;
  originalText: string;
}

export default function ResultClient({ id, subject, sender, receiver, translatedText, originalText }: ResultClientProps) {
  const frameRef = useRef(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  // 클립보드 복사 및 알림
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMsg("결과를 클립보드에 저장하였습니다.\n친구들에게 내가 받은 이메일의 속마음을 공유해주세요.");
      // dataLayer 이벤트 전송
      if (typeof window !== 'undefined') {
        const w = window as any;
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({
          event: 'share',
          result_id: id,
          sender: sender?.name || ''
        });
      }
      setTimeout(() => setCopyMsg(""), 3000);
    } catch {
      setCopyMsg("클립보드 복사에 실패했습니다.");
      setTimeout(() => setCopyMsg(""), 3000);
    }
  };

  useEffect(() => {
    if (!id) return;
    // 최초 진입 시 view_result 이벤트 전송
    if (typeof window !== 'undefined') {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: 'view_result',
        result_id: id,
        sender: sender?.name || ''
      });
    }
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center sm:bg-[linear-gradient(180deg,_#FF7AC3_0%,_#A259F7_100%)] bg-white">
      <div className="flex flex-col items-center justify-center flex-1 grow w-full h-full">
        <PhoneFrame ref={frameRef} id="phone-frame">
          <div className="flex flex-col h-full relative">
            <StatusBar />
            <MailHeader
              onBack={() => window.location.href = '/'}
              showOriginal={showOriginal}
              setShowOriginal={setShowOriginal}
              sender={sender}
              id={id}
              translatedText={translatedText}
              originalText={originalText}
            />
            {/* 결과 텍스트 영역: 프레임 내부에서만 스크롤, 버튼 위에 배치 */}
            <div className="flex-1 flex flex-col overflow-y-auto pb-28 max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-220px)]">
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
                  {(showOriginal ? originalText : translatedText)?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </div>
            {/* 결과 공유하기 버튼: 프레임 내부 하단에 고정 */}
            <div className="w-full px-5 pb-4 fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md z-10">
              <button
                className="w-full py-3 rounded-xl bg-[#007aff] text-white font-bold text-base hover:bg-[#005fcc] transition-colors drop-shadow"
                onClick={handleShare}
              >
                결과 공유하기
              </button>
              {copyMsg && (
                <div className="mt-2 text-center text-sm text-blue-700 whitespace-pre-line">{copyMsg}</div>
              )}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
} 