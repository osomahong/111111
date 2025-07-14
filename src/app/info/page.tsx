"use client";
import React, { useState, useEffect } from "react";
import PhoneFrame from "../../components/PhoneFrame";
import { useRouter } from "next/navigation";
// EmailInput import 제거

const days = ["일", "월", "화", "수", "목", "금", "토"];

function StatusBar() {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return (
    <div className="flex justify-between items-center px-5 pt-4 pb-2 text-xs sm:text-sm font-semibold text-[#1c1c1e]">
      <span className="time sm:text-base">{time}</span>
      <div className="flex items-center gap-2">
        <span className="sm:text-sm">LTE</span>
        {/* Wi-Fi Icon */}
        <svg className="sm:w-5 sm:h-5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
        {/* Battery Icon */}
        <svg className="sm:w-6 sm:h-6" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20,10V8.3C20,7.6,19.4,7,18.7,7H3.3C2.6,7,2,7.6,2,8.3v7.3C2,16.4,2.6,17,3.3,17h15.3c0.7,0,1.3-0.6,1.3-1.3V14h2v-4H20z"></path></svg>
      </div>
    </div>
  );
}

function AppHeader() {
  const router = useRouter();
  return (
    <div className="flex flex-col px-5 py-2 border-b border-[#f0f0f0]">
      <div className="flex items-center justify-between">
        <button
          className="mr-2 text-xl text-[#007aff] font-bold px-1 py-1 rounded hover:bg-[#e6f0ff] active:bg-[#d0e7ff] transition"
          onClick={() => router.push("/")}
          aria-label="뒤로가기"
        >
          ←
        </button>
        {/* 보내기 버튼 제거 */}
      </div>
      <h1 className="text-base sm:text-base font-bold m-0 mt-2 text-center">K직장인 속마음 메일 통번역 서비스</h1>
    </div>
  );
}

export const metadata = {
  title: "당신이 받은 메일의 정보를 입력해주세요. | K직장인 속마음 번역기",
  description: "받은 메일의 발신자와 본문을 입력하면, K직장인 속마음 번역기가 진심을 분석해드립니다.",
  openGraph: {
    title: "당신이 받은 메일의 정보를 입력해주세요. | K직장인 속마음 번역기",
    description: "받은 메일의 발신자와 본문을 입력하면, K직장인 속마음 번역기가 진심을 분석해드립니다.",
    url: "https://111111-pi.vercel.app/info",
    images: ["/assets/kworker-icon.png"],
  },
  alternates: {
    canonical: "https://111111-pi.vercel.app/info",
  },
};

export default function InfoPage() {
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [alerted, setAlerted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const MAX_BODY = 3000;
  const isOverLimit = body.length > MAX_BODY;

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBody(value);
    if (value.length > MAX_BODY && !alerted) {
      alert("본문은 3,000자까지만 입력할 수 있습니다.");
      setAlerted(true);
    }
    if (value.length <= MAX_BODY && alerted) {
      setAlerted(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const emailAuth = localStorage.getItem("email-auth-ok");
      if (!emailAuth) {
        router.replace("/email-auth");
      }
    }
  }, []);

  const handleSubmit = async () => {
    console.log('handleSubmit 실행');
    if (!from) {
      setError("보낸 사람을 입력해 주세요.");
      return;
    }
    if (!body) {
      setError("받은 메일의 내용을 입력해 주세요.");
      return;
    }
    if (isOverLimit) {
      setError("본문은 3,000자까지만 입력할 수 있습니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. AI 변환 요청
      const translateRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: from, receiver: "", body }),
      });
      const translateData = await translateRes.json();
      if (translateData.error) {
        setError(translateData.error);
        setLoading(false);
        return;
      }
      if (!translateData.result) {
        setError('AI 변환 결과가 비어 있습니다.');
        setLoading(false);
        return;
      }
      // GTM 이벤트: 번역 성공
      if (typeof window !== 'undefined') {
        const w = window as any;
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({
          event: 'translate_complete',
          sender: from,
          email_contents: body.replace(/\n/g, ' ').slice(0, 80)
        });
      }
      console.log('save-result 요청 직전', translateData.result);
      // 2. 결과 저장
      const saveRes = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: body,
          translatedText: translateData.result,
          senderName: from,
        }),
      });
      const saveData = await saveRes.json();
      console.log('saveData:', saveData);
      if (saveData.error) {
        setError(saveData.error);
        setLoading(false);
        return;
      }
      if (!saveData.id) {
        setError('결과 저장에 실패했습니다.');
        setLoading(false);
        return;
      }
      // 3. 결과 페이지로 이동
      router.push(`/result/${saveData.id}`);
    } catch (e) {
      console.error('save-result fetch 에러:', e);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const Content = (
    <div
      className="w-full h-full flex flex-col bg-white shadow-inner md:rounded-[35px] md:overflow-hidden md:shadow-inner rounded-none sm:shadow-none sm:h-screen sm:min-h-0 sm:max-h-none"
    >
      <div className="sm:pt-2 md:pt-0">
        <StatusBar />
      </div>
      <AppHeader />
      <div className="flex-1 flex flex-col sm:pt-2 sm:pb-4 sm:px-2 md:pt-0 md:pb-0 md:px-0">
        <form className="px-5 sm:px-2" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="flex items-center py-3 border-b border-[#f0f0f0] sm:py-2">
            <label className="text-[#8a8a8e] mr-3 text-sm min-w-fit sm:text-xs sm:mr-2">보낸 사람:</label>
            <input type="text" className="flex-1 border-none outline-none text-sm bg-transparent sm:text-xs" value={from} onChange={e => setFrom(e.target.value)} placeholder="보낸이 이름/직책" disabled={loading} />
          </div>
        </form>
        <textarea
          className="flex-1 border-none outline-none px-5 py-4 text-base resize-none bg-transparent sm:px-2 sm:py-2 sm:text-sm"
          placeholder="받은 메일의 내용을 붙여넣으세요..."
          value={body}
          onChange={handleBodyChange}
          maxLength={MAX_BODY + 1000}
          disabled={loading}
        />
        <div className="px-5 sm:px-2 mt-4">
          <button
            className="w-full bg-[#007aff] text-white rounded-2xl px-4 py-3 text-base font-medium disabled:bg-gray-300 disabled:text-gray-400"
            disabled={isOverLimit || !from || !body || loading}
            onClick={handleSubmit}
            type="button"
          >
            {loading ? '보내는 중...' : '보내기'}
          </button>
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{background: "linear-gradient(180deg, #FF7AC3 0%, #A259F7 100%)"}}>
      <PhoneFrame>{Content}</PhoneFrame>
    </div>
  );
} 