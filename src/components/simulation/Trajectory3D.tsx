/**
 * 軌道3D表示コンポーネント
 *
 * Three.js (React Three Fiber) を使用して軌道を3D表示
 */

import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Text } from '@react-three/drei';
import { useMissionStore } from '../../store/missionStore';
import type { TrajectoryPoint } from '../../types/trajectory';
import * as THREE from 'three';

/**
 * 軌道ラインコンポーネント
 */
function TrajectoryLine({
  points,
  color,
}: {
  points: TrajectoryPoint[];
  color: string;
}) {
  const linePoints = useMemo(() => {
    return points.map((p) => new THREE.Vector3(p.position.x, p.position.z, -p.position.y));
  }, [points]);

  if (linePoints.length < 2) return null;

  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={3}
    />
  );
}

/**
 * マーカー（球体）
 */
function Marker({
  position,
  color,
  size = 3,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

/**
 * 軸ラベル
 */
function AxisLabels({ maxAltitude }: { maxAltitude: number }) {
  const scale = Math.max(100, maxAltitude);

  return (
    <>
      <Text position={[scale * 0.6, 0, 0]} fontSize={8} color="#94a3b8">
        東 (E)
      </Text>
      <Text position={[0, scale * 0.6, 0]} fontSize={8} color="#94a3b8">
        高度
      </Text>
      <Text position={[0, 0, -scale * 0.6]} fontSize={8} color="#94a3b8">
        北 (N)
      </Text>
    </>
  );
}

/**
 * 3Dシーン内部
 */
function Scene() {
  const { trajectoryResult } = useMissionStore();
  const controlsRef = useRef(null);

  // 軌道データがない場合
  if (!trajectoryResult) {
    return (
      <>
        <ambientLight intensity={0.5} />
        <Grid
          args={[200, 200]}
          cellSize={10}
          cellColor="#334155"
          sectionSize={50}
          sectionColor="#475569"
          fadeDistance={500}
        />
        <Text position={[0, 50, 0]} fontSize={12} color="#64748b">
          シミュレーションを実行してください
        </Text>
      </>
    );
  }

  const { trajectoryPoints, stats } = trajectoryResult;

  // フェーズ別に分割
  const ascentPoints = trajectoryPoints.filter(
    (p) => p.phase === 'thrust' || p.phase === 'coast'
  );
  const descentPoints = trajectoryPoints.filter((p) => p.phase === 'descent');

  // 頂点を探す
  const apogeePoint = trajectoryPoints.reduce((max, p) =>
    p.position.z > max.position.z ? p : max
  );

  // 着地点
  const landingPoint = trajectoryPoints[trajectoryPoints.length - 1];

  // スケール計算
  const maxAlt = stats.maxAltitude;
  const gridSize = Math.max(200, maxAlt * 2, stats.horizontalDistance * 2);

  return (
    <>
      {/* ライティング */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 200, 100]} intensity={0.8} />
      <directionalLight position={[-100, 100, -100]} intensity={0.3} />

      {/* グリッド（地面） */}
      <Grid
        args={[gridSize, gridSize]}
        cellSize={gridSize / 20}
        cellColor="#334155"
        sectionSize={gridSize / 4}
        sectionColor="#475569"
        fadeDistance={gridSize * 2}
      />

      {/* 軌道ライン - 上昇（青） */}
      <TrajectoryLine points={ascentPoints} color="#3b82f6" />

      {/* 軌道ライン - 降下（緑） */}
      <TrajectoryLine points={descentPoints} color="#22c55e" />

      {/* 発射地点マーカー（青） */}
      <Marker position={[0, 0, 0]} color="#3b82f6" size={maxAlt * 0.02} />

      {/* 頂点マーカー（黄） */}
      <Marker
        position={[
          apogeePoint.position.x,
          apogeePoint.position.z,
          -apogeePoint.position.y,
        ]}
        color="#f59e0b"
        size={maxAlt * 0.03}
      />

      {/* 着地点マーカー（赤） */}
      <Marker
        position={[
          landingPoint.position.x,
          Math.max(landingPoint.position.z, 0),
          -landingPoint.position.y,
        ]}
        color="#ef4444"
        size={maxAlt * 0.025}
      />

      {/* 軸ラベル */}
      <AxisLabels maxAltitude={maxAlt} />

      {/* カメラコントロール */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        maxDistance={gridSize * 2}
        minDistance={10}
        target={[0, maxAlt / 2, 0]}
      />
    </>
  );
}

/**
 * 軌道3D表示メインコンポーネント
 */
export function Trajectory3D() {
  const { trajectoryResult } = useMissionStore();
  const maxAlt = trajectoryResult?.stats.maxAltitude ?? 100;
  const cameraDistance = Math.max(200, maxAlt * 2);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <Canvas
        camera={{
          position: [cameraDistance * 0.8, cameraDistance * 0.6, cameraDistance * 0.8],
          fov: 50,
          near: 1,
          far: cameraDistance * 10,
        }}
      >
        <Scene />
      </Canvas>

      {/* 凡例 */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 px-3 py-2 rounded-lg text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-300">上昇</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-300">降下</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-300">頂点</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-300">着地点</span>
        </div>
      </div>

      {/* 操作説明 */}
      <div className="absolute top-4 right-4 bg-slate-800/90 px-3 py-2 rounded-lg text-xs text-slate-400">
        ドラッグ: 回転 / スクロール: ズーム
      </div>
    </div>
  );
}
