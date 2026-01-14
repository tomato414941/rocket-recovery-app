/**
 * タッチスクロールラッパー
 * モバイルでのスクロールとチャート操作の競合を解消
 */
import { useRef, useState, type ReactNode, type TouchEvent } from 'react';

interface TouchScrollWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * タッチジェスチャーを検出し、縦スクロールとチャート操作を区別するラッパー
 * 縦方向の動きが大きい場合はスクロール、そうでなければチャート操作として扱う
 */
export function TouchScrollWrapper({ children, className }: TouchScrollWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    setIsScrolling(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);

    // 縦方向の移動が横方向より大きく、かつ10px以上の場合はスクロール
    if (deltaY > deltaX && deltaY > 10) {
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = () => {
    setIsScrolling(false);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: isScrolling ? 'pan-y' : 'none' }}
    >
      {children}
    </div>
  );
}
