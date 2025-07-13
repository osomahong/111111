'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import SwipeToStart from '../components/SwipeToStart';

export default function Home() {
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);
  const [now, setNow] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [today, setToday] = useState(() => {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNow(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
      setToday(`${d.getMonth() + 1}월 ${d.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}요일`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    setFadeOut(true);
    setTimeout(() => {
      router.push('/email-auth');
      setFadeOut(false);
    }, 500); // 0.5초 후 이동
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{background: "linear-gradient(180deg, #FF7AC3 0%, #A259F7 100%)"}}>
      <PhoneFrame innerBgImageUrl="/assets/frame-bg.jpg">
        <div className="flex flex-col h-full w-full px-6 pt-6 pb-10 relative justify-between md:justify-between md:h-full md:items-center mt-10">
          {/* 날짜/시간/카드 중앙 정렬 */}
          <div className="w-full flex flex-col items-center justify-center md:w-auto md:flex md:flex-col md:items-center md:mt-6">
            <div className="text-sm font-medium text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] mb-2 md:text-center">{today}</div>
            <div className="font-bebas text-7xl font-black tracking-widest mb-4 md:text-center text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">{now}</div>
            {/* 푸시 알림 스타일 카드 */}
            <div className="w-full max-w-xs bg-white/70 border border-gray-200/40 rounded-2xl p-4 mb-8 shadow-lg backdrop-blur-md md:my-0 md:mx-auto">
              <div className="flex items-center gap-2 text-xs font-semibold opacity-80 mb-1">
                <div className="w-5 h-5 bg-pink-100 rounded mr-2" />
                K직장인 속마음 번역기
              </div>
              <div className="mt-1">
                <div className="font-bold text-sm">당신이 받은 메일.. 진심일까요?</div>
                <div className="text-xs opacity-90 mt-1 leading-relaxed">메일 발신/수신 정보를 입력하고, 실제 속마음을 확인해보세요.</div>
              </div>
            </div>
          </div>
          {/* 하단: 슬라이드 버튼 */}
          <div className="w-full mb-10">
            <SwipeToStart onSuccess={handleStart} />
          </div>
          {/* 전체 화면 전환 오버레이 */}
          {fadeOut && (
            <div className="fixed inset-0 z-50 bg-black/80 animate-fadeout pointer-events-none" />
          )}
        </div>
      </PhoneFrame>
    </div>
  );
}
