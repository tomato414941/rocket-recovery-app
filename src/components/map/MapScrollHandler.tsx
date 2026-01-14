/**
 * 地図スクロール制御コンポーネント
 * マウスホバー時のみスクロールズームを有効化し、ページスクロールとの競合を防ぐ
 */
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * 地図のスクロールズーム動作を制御
 * デフォルトでは無効にし、マウスが地図上にあるときのみ有効化
 */
export function MapScrollHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    // デフォルトでスクロールズームを無効化
    map.scrollWheelZoom.disable();

    const enableZoom = () => {
      map.scrollWheelZoom.enable();
    };

    const disableZoom = () => {
      map.scrollWheelZoom.disable();
    };

    // マウスホバー時にスクロールズームを有効化
    container.addEventListener('mouseenter', enableZoom);
    container.addEventListener('mouseleave', disableZoom);

    // モバイル: タッチ開始時にズームを有効化
    container.addEventListener('touchstart', enableZoom, { passive: true });
    container.addEventListener('touchend', disableZoom, { passive: true });

    return () => {
      container.removeEventListener('mouseenter', enableZoom);
      container.removeEventListener('mouseleave', disableZoom);
      container.removeEventListener('touchstart', enableZoom);
      container.removeEventListener('touchend', disableZoom);
    };
  }, [map]);

  return null;
}
