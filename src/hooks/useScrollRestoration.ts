/**
 * スクロール位置の保存・復元フック
 * タブ切替時にスクロール位置を維持する
 */
import { useEffect, useRef, useMemo } from 'react';
import { useMissionStore, type ViewMode } from '../store/missionStore';

/**
 * デバウンス関数を作成するフック
 */
function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useMemo(() => {
    const debouncedFn = (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    };
    return debouncedFn as T;
  }, [fn, delay]);
}

/**
 * スクロール位置を保存・復元するフック
 * @param viewMode - 現在のビューモード
 * @returns containerRef - スクロールコンテナに設定するref, onScroll - スクロールイベントハンドラ
 */
export function useScrollRestoration(viewMode: ViewMode) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollPositions, setScrollPosition } = useMissionStore();

  // スクロール位置を復元
  useEffect(() => {
    const container = containerRef.current;
    if (container && scrollPositions[viewMode] > 0) {
      // 次のフレームで復元（DOMが確定した後）
      requestAnimationFrame(() => {
        container.scrollTop = scrollPositions[viewMode];
      });
    }
  }, [viewMode, scrollPositions]);

  // スクロール位置を保存（デバウンス付き）
  const saveScrollPosition = useMemo(
    () => (position: number) => setScrollPosition(viewMode, position),
    [viewMode, setScrollPosition]
  );

  const handleScroll = useDebounce(() => {
    if (containerRef.current) {
      saveScrollPosition(containerRef.current.scrollTop);
    }
  }, 100);

  return { containerRef, onScroll: handleScroll };
}
