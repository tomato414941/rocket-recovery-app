/**
 * スクロールスパイフック
 * スクロール中にどのセクションが表示されているかを追跡
 */
import { useState, useEffect, useRef } from 'react';

/**
 * スクロール中の現在セクションを追跡するフック
 * @param sectionIds - 追跡するセクションのID配列
 * @param options - IntersectionObserverのオプション
 * @returns activeSection - 現在アクティブなセクションのID
 */
export function useScrollSpy(
  sectionIds: string[],
  options: {
    threshold?: number;
    rootMargin?: string;
  } = {}
) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { threshold = 0.5, rootMargin = '-100px 0px -50% 0px' } = options;

  useEffect(() => {
    // クリーンアップ用
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 最も見えているセクションを特定
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // intersectionRatioが最も高いエントリーを選択
          const mostVisible = visibleEntries.reduce((prev, current) =>
            prev.intersectionRatio > current.intersectionRatio ? prev : current
          );
          setActiveSection(mostVisible.target.id);
        }
      },
      { threshold, rootMargin }
    );

    // 各セクションを監視
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sectionIds, threshold, rootMargin]);

  return activeSection;
}
