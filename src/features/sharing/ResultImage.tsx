"use client";
import React, { useRef, useState } from "react";

const SNS = [
  {
    name: "인스타그램",
    url: (img: string) => `https://www.instagram.com/create/story/?image=${encodeURIComponent(img)}`,
    icon: "📸",
  },
  {
    name: "트위터",
    url: (img: string) => `https://twitter.com/intent/tweet?text=K-직장인 속마음 변환 결과&url=${encodeURIComponent(img)}`,
    icon: "🐦",
  },
  {
    name: "페이스북",
    url: (img: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(img)}`,
    icon: "📘",
  },
  {
    name: "카카오톡",
    url: (img: string) => `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(img)}`,
    icon: "💬",
  },
  {
    name: "링크드인",
    url: (img: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(img)}`,
    icon: "💼",
  },
];

interface ResultImageProps {
  result: string;
}

export default function ResultImage({ result }: ResultImageProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

const handleCapture = async () => {
  setLoading(true);
  setFeedback("");
  try {
    // 캡처할 URL: 현재 페이지의 전체 URL (og:image 용이면 result/[id] 페이지의 URL이어야 함)
    const captureUrl = window.location.href;
    // 필요하다면 특정 selector도 전달 가능 (예: "#capture-target")
    const res = await fetch("https://111111-pi.vercel.app/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: captureUrl,
        // selector: "#캡처할요소ID", // 필요시 주석 해제
        format: "png",
        fullPage: false,
      }),
    });
    if (!res.ok) throw new Error("캡처 서버 응답 오류");
    const data = await res.json();
    setImgUrl(data.imageUrl);
    setFeedback("이미지 생성 완료!");
  } catch (e) {
    setFeedback("이미지 생성 실패");
  }
  setLoading(false);
};

  const handleDownload = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `realmail_result_${Date.now()}.png`;
    a.click();
    setFeedback("이미지 다운로드 완료!");
  };

  const handleShare = (sns: typeof SNS[0]) => {
    if (!imgUrl) return;
    try {
      window.open(sns.url(imgUrl), "_blank");
      setFeedback(`${sns.name} 공유창이 열렸습니다.`);
    } catch {
      setFeedback(`${sns.name} 공유 실패. 직접 이미지를 저장해 공유해 주세요.`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div
        ref={captureRef}
        className="w-[360px] h-[640px] md:w-[540px] md:h-[960px] bg-zinc-100 dark:bg-zinc-800 rounded-lg shadow-lg flex flex-col items-center justify-center p-6 relative"
        style={{ minHeight: 320, minWidth: 200 }}
      >
        <div className="font-bold text-lg mb-2 text-zinc-800 dark:text-zinc-100">속마음 변환 결과</div>
        <div className="whitespace-pre-line text-zinc-700 dark:text-zinc-200 text-center break-words">
          {result}
        </div>
      </div>
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
        onClick={handleCapture}
        disabled={loading}
      >
        {loading ? "이미지 변환 중..." : "이미지로 저장/공유하기"}
      </button>
      {imgUrl && (
        <>
          <img
            src={imgUrl}
            alt="변환 결과 이미지"
            className="w-[180px] h-auto border rounded shadow-md"
            style={{ maxHeight: 320 }}
          />
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
              onClick={handleDownload}
            >
              PNG 다운로드
            </button>
            {SNS.map((sns) => (
              <button
                key={sns.name}
                className="px-3 py-1 rounded bg-zinc-700 text-white font-semibold hover:bg-zinc-900 flex items-center gap-1"
                onClick={() => handleShare(sns)}
              >
                <span>{sns.icon}</span>
                <span>{sns.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {feedback && <div className="text-sm text-blue-600 dark:text-blue-300 mt-2">{feedback}</div>}
    </div>
  );
} 
