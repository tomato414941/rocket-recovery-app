/**
 * アプリケーションシェル
 * レスポンシブレイアウトの管理
 */

import type { ReactNode } from 'react';
import { useMissionStore, type ViewMode } from '../../store/missionStore';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import { Rocket, Map, Navigation } from 'lucide-react';

interface AppShellProps {
  sidebar: ReactNode;
  main: ReactNode;
  bottom?: ReactNode;
}

/**
 * タブボタン
 */
function TabButton({
  mode,
  currentMode,
  onClick,
  icon: Icon,
  label,
}: {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: () => void;
  icon: typeof Rocket;
  label: string;
}) {
  const isActive = mode === currentMode;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/**
 * ナビゲーションヘッダー
 */
function NavigationHeader() {
  const { viewMode, setViewMode } = useMissionStore();

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-50 flex items-center gap-2">
          <Rocket className="text-blue-500" size={24} />
          Rocket Recovery
        </h1>

        <nav className="flex gap-2">
          <TabButton
            mode="setup"
            currentMode={viewMode}
            onClick={() => setViewMode('setup')}
            icon={Rocket}
            label="設定"
          />
          <TabButton
            mode="simulation"
            currentMode={viewMode}
            onClick={() => setViewMode('simulation')}
            icon={Map}
            label="予測"
          />
          <TabButton
            mode="recovery"
            currentMode={viewMode}
            onClick={() => setViewMode('recovery')}
            icon={Navigation}
            label="回収"
          />
        </nav>
      </div>
    </header>
  );
}

/**
 * デスクトップレイアウト
 */
function DesktopLayout({ sidebar, main, bottom }: AppShellProps) {
  const { viewMode } = useMissionStore();
  const { containerRef, onScroll } = useScrollRestoration(viewMode);

  return (
    <div className="hidden md:flex flex-col h-screen md:h-[100dvh] bg-slate-900">
      <NavigationHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside
          ref={containerRef}
          onScroll={onScroll}
          className="w-80 lg:w-96 border-r border-slate-700 overflow-y-auto bg-slate-800 scroll-container"
        >
          {sidebar}
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">{main}</div>
          {bottom && (
            <div className="min-h-48 max-h-64 border-t border-slate-700 bg-slate-800 overflow-y-auto flex-shrink-0">
              {bottom}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * モバイルレイアウト
 */
function MobileLayout({ sidebar, main, bottom }: AppShellProps) {
  const { viewMode } = useMissionStore();
  const { containerRef, onScroll } = useScrollRestoration(viewMode);

  return (
    <div className="flex md:hidden flex-col h-[100dvh] bg-slate-900">
      <NavigationHeader />

      {viewMode === 'setup' ? (
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto bg-slate-800 scroll-container"
        >
          {sidebar}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">{main}</div>
          {bottom && (
            <div className="max-h-[40vh] border-t border-slate-700 bg-slate-800 overflow-y-auto scroll-container">
              {bottom}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * メインのAppShellコンポーネント
 */
export function AppShell(props: AppShellProps) {
  return (
    <>
      <DesktopLayout {...props} />
      <MobileLayout {...props} />
    </>
  );
}
