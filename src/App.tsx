/**
 * Rocket Recovery App - メインアプリケーション
 */

import { useState } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { MissionSetup } from './components/mission/MissionSetup';
import { MapView } from './components/map/MapContainer';
import { SimulationResults } from './components/simulation/SimulationResults';
import { FlightChart } from './components/simulation/FlightChart';
import { Trajectory3D } from './components/simulation/Trajectory3D';
import { RecoveryAssist } from './components/recovery/RecoveryAssist';
import { useMissionStore } from './store/missionStore';
import { Map, Box } from 'lucide-react';

function App() {
  const { viewMode } = useMissionStore();
  const [is3DView, setIs3DView] = useState(false);

  // viewModeに応じてmain/bottomコンテンツを切り替え
  const renderMainContent = () => {
    // simulationモードで3D表示の場合
    if (viewMode === 'simulation' && is3DView) {
      return (
        <div className="relative w-full h-full">
          <Trajectory3D />
          {/* 2D/3D切り替えボタン */}
          <div className="absolute top-4 right-4 z-10">
            <ViewToggle is3D={is3DView} onToggle={setIs3DView} />
          </div>
        </div>
      );
    }

    // 2D地図表示（切り替えボタン付き）
    if (viewMode === 'simulation') {
      return (
        <div className="relative w-full h-full">
          <MapView />
          {/* 2D/3D切り替えボタン */}
          <div className="absolute top-4 right-4 z-[1000]">
            <ViewToggle is3D={is3DView} onToggle={setIs3DView} />
          </div>
        </div>
      );
    }

    return <MapView />;
  };

  const renderBottomContent = () => {
    switch (viewMode) {
      case 'simulation':
        return <FlightChart />;
      default:
        return null;
    }
  };

  const renderSidebarContent = () => {
    switch (viewMode) {
      case 'setup':
        return <MissionSetup />;
      case 'simulation':
        return <SimulationResults />;
      case 'recovery':
        return <RecoveryAssist />;
      default:
        return <MissionSetup />;
    }
  };

  return (
    <AppShell
      sidebar={renderSidebarContent()}
      main={renderMainContent()}
      bottom={renderBottomContent()}
    />
  );
}

/**
 * 2D/3D切り替えボタン
 */
function ViewToggle({
  is3D,
  onToggle,
}: {
  is3D: boolean;
  onToggle: (is3D: boolean) => void;
}) {
  return (
    <div className="flex bg-slate-800 rounded-lg p-1 shadow-lg">
      <button
        onClick={() => onToggle(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          !is3D
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Map size={16} />
        2D
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          is3D
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Box size={16} />
        3D
      </button>
    </div>
  );
}

export default App;
