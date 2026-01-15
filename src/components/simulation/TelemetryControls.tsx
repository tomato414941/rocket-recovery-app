/**
 * テレメトリー再生コントロール
 */

import { useState } from 'react';
import { Play, Pause, Square, FastForward } from 'lucide-react';
import { useTelemetrySimulation } from '../../hooks/useTelemetrySimulation';
import { TelemetryStatusBadge } from '../shared/TelemetryStatusBadge';

const PLAYBACK_SPEEDS = [0.5, 1, 2, 5, 10];

export function TelemetryControls() {
  const { status, start, stop, pause, resume, setSpeed, currentTime, totalTime, progress } = useTelemetrySimulation();
  const [selectedSpeed, setSelectedSpeed] = useState(1);

  const handleSpeedChange = (speed: number) => {
    setSelectedSpeed(speed);
    setSpeed(speed);
  };

  const handlePlayPause = () => {
    if (status === 'idle' || status === 'completed') {
      start('gps');
    } else if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    }
  };

  const handleStop = () => {
    stop();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-slate-300">テレメトリー再生</div>
        <TelemetryStatusBadge status={status} />
      </div>

      {/* プログレスバー */}
      <div className="mb-3">
        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      {/* コントロールボタン */}
      <div className="flex items-center gap-2">
        {/* 再生/一時停止ボタン */}
        <button
          onClick={handlePlayPause}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {status === 'running' ? (
            <>
              <Pause size={16} />
              一時停止
            </>
          ) : status === 'paused' ? (
            <>
              <Play size={16} />
              再開
            </>
          ) : (
            <>
              <Play size={16} />
              開始
            </>
          )}
        </button>

        {/* 停止ボタン */}
        <button
          onClick={handleStop}
          disabled={status === 'idle'}
          className="py-2 px-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg flex items-center justify-center transition-colors"
        >
          <Square size={16} />
        </button>
      </div>

      {/* 再生速度 */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <FastForward size={12} />
          再生速度
        </div>
        <div className="flex gap-1">
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                selectedSpeed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
