import React, { forwardRef, useEffect, useState } from 'react';

/**
 * PC에서는 스마트폰 프레임을 감싸고, 모바일에서는 내부만 보여주는 컴포넌트
 */
const PhoneFrame = forwardRef<HTMLDivElement, { children: React.ReactNode, id?: string, innerBgImageUrl?: string }>(
  ({ children, id, innerBgImageUrl }, ref) => {
    const [isPc, setIsPc] = useState(false);

    useEffect(() => {
      const check = () => setIsPc(window.innerWidth >= 768);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);

    return (
      <div
        ref={ref}
        id={id}
        className={
          isPc
            ? "relative w-[320px] h-[650px] border-[20px] border-[#111] rounded-[45px] shadow-2xl flex flex-col items-center justify-center mx-auto bg-transparent"
            : "w-full min-h-screen h-screen bg-white flex flex-col"
        }
        style={isPc ? { maxWidth: '100vw', maxHeight: '100vh' } : {}}
      >
        {isPc && (
          <>
            {/* 측면 버튼 */}
            <div className="absolute left-[-22px] top-[120px] w-[2px] h-[40px] bg-[#333] rounded-l"></div>
            <div className="absolute left-[-22px] top-[180px] w-[2px] h-[40px] bg-[#333] rounded-l"></div>
            <div className="absolute right-[-22px] top-[160px] w-[2px] h-[70px] bg-[#333] rounded-r"></div>
          </>
        )}
        {/* 스마트폰 화면 */}
        <div
          className={isPc ? "w-[280px] h-[610px] bg-white rounded-[20px] overflow-hidden flex flex-col relative shadow-inner" : "flex-1 flex flex-col h-full min-h-0"}
          style={isPc && innerBgImageUrl ? { backgroundImage: `url(${innerBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {children}
          {isPc && (
            <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-white/60 rounded-[5px]" />
          )}
        </div>
      </div>
    );
  }
);
PhoneFrame.displayName = 'PhoneFrame';
export default PhoneFrame; 