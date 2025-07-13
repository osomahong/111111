import React, { useRef, useState, useEffect } from 'react';

interface SwipeToStartProps {
  onSuccess: () => void;
  label?: string;
}

export default function SwipeToStart({ onSuccess, label = '눌러서 시작' }: SwipeToStartProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);

  // 최신 핸들러 참조를 위한 useRef
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | undefined>(undefined);
  const mouseUpHandlerRef = useRef<(() => void) | undefined>(undefined);
  const touchMoveHandlerRef = useRef<((e: TouchEvent) => void) | undefined>(undefined);
  const touchEndHandlerRef = useRef<(() => void) | undefined>(undefined);

  const maxDrag = 180;

  // PC: 마우스 드래그
  function handleMouseDown(e: React.MouseEvent) {
    if (completed) return;
    setIsDragging(true);
    dragStartX.current = e.clientX - dragX;
    window.addEventListener('mousemove', mouseMoveHandlerRef.current!);
    window.addEventListener('mouseup', mouseUpHandlerRef.current!);
  }
  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, maxDrag));
    setDragX(x);
  }
  function handleMouseUp() {
    setIsDragging(false);
    window.removeEventListener('mousemove', mouseMoveHandlerRef.current!);
    window.removeEventListener('mouseup', mouseUpHandlerRef.current!);
    if (dragX > maxDrag * 0.85) {
      setCompleted(true);
      setTimeout(() => {
        onSuccess();
        setCompleted(false);
        setDragX(0);
      }, 300);
    } else {
      setDragX(0);
    }
  }

  // 모바일: 터치 드래그
  function handleTouchStart(e: React.TouchEvent) {
    if (completed) return;
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX - dragX;
    window.addEventListener('touchmove', touchMoveHandlerRef.current!);
    window.addEventListener('touchend', touchEndHandlerRef.current!);
  }
  function handleTouchMove(e: TouchEvent) {
    if (!isDragging) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = e.touches[0].clientX - rect.left;
    x = Math.max(0, Math.min(x, maxDrag));
    setDragX(x);
  }
  function handleTouchEnd() {
    setIsDragging(false);
    window.removeEventListener('touchmove', touchMoveHandlerRef.current!);
    window.removeEventListener('touchend', touchEndHandlerRef.current!);
    if (dragX > maxDrag * 0.85) {
      setCompleted(true);
      setTimeout(() => {
        onSuccess();
        setCompleted(false);
        setDragX(0);
      }, 300);
    } else {
      setDragX(0);
    }
  }

  // 항상 최신 핸들러를 useRef에 저장
  useEffect(() => {
    mouseMoveHandlerRef.current = handleMouseMove;
    mouseUpHandlerRef.current = handleMouseUp;
    touchMoveHandlerRef.current = handleTouchMove;
    touchEndHandlerRef.current = handleTouchEnd;
  });

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div
        ref={trackRef}
        className="relative w-[200px] h-12 bg-white/30 rounded-full flex items-center overflow-hidden shadow-inner"
        style={{ touchAction: 'pan-x' }}
      >
        {/* 슬라이드 텍스트 */}
        <span className={`absolute left-0 right-0 text-center text-[#fff] text-base font-semibold transition-opacity duration-200 ${dragX > maxDrag * 0.4 ? 'opacity-0' : 'opacity-100'}`}
        >{label}</span>
        {/* 슬라이더 핸들 */}
        <div
          className={`absolute top-1 left-1 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center cursor-pointer transition-transform duration-200 ${completed ? 'bg-green-400' : ''}`}
          style={{
            transform: `translateX(${dragX}px)`,
            zIndex: 10,
            pointerEvents: 'auto',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={() => {
            if (!completed) {
              setCompleted(true);
              setTimeout(() => {
                onSuccess();
                setCompleted(false);
                setDragX(0);
              }, 300);
            }
          }}
        >
          <svg width="24" height="24" fill="none" stroke="#A459D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
        {/* 트랙 배경 애니메이션 */}
        <div className="absolute top-0 left-0 h-full bg-white/60 rounded-full transition-all duration-200" style={{ width: dragX + 48, zIndex: 0 }} />
      </div>
    </div>
  );
} 