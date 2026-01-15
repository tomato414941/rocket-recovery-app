/**
 * テレメトリーステータスバッジ
 */

import type { TelemetryServiceStatus } from '../../services/telemetry';

interface TelemetryStatusBadgeProps {
  status: TelemetryServiceStatus;
}

export function TelemetryStatusBadge({ status }: TelemetryStatusBadgeProps) {
  const config: Record<TelemetryServiceStatus, {
    label: string;
    dotClass: string;
    textClass: string;
    bgClass: string;
  }> = {
    running: {
      label: 'LIVE',
      dotClass: 'bg-green-400 animate-pulse',
      textClass: 'text-green-400',
      bgClass: 'bg-green-500/10 border-green-500/30',
    },
    paused: {
      label: 'PAUSED',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
    },
    completed: {
      label: 'COMPLETED',
      dotClass: 'bg-blue-400',
      textClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10 border-blue-500/30',
    },
    idle: {
      label: 'OFFLINE',
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10 border-slate-500/30',
    },
  };

  const { label, dotClass, textClass, bgClass } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${bgClass}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className={textClass}>{label}</span>
    </div>
  );
}
