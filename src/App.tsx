/**
 * Rocket Recovery App - メインアプリケーション
 */

import './App.css';
import { AppShell } from './components/layout/AppShell';
import { MissionSetup } from './components/mission/MissionSetup';
import { MapView } from './components/map/MapContainer';
import { SimulationResults } from './components/simulation/SimulationResults';
import { FlightChart } from './components/simulation/FlightChart';
import { RecoveryAssist } from './components/recovery/RecoveryAssist';
import { useMissionStore } from './store/missionStore';

function App() {
  const { viewMode } = useMissionStore();

  // viewModeに応じてmain/bottomコンテンツを切り替え
  const renderMainContent = () => {
    switch (viewMode) {
      case 'setup':
      case 'simulation':
      case 'recovery':
        return <MapView />;
      default:
        return <MapView />;
    }
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

export default App;
