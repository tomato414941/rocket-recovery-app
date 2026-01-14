# Rocket Recovery App

モデルロケットの軌道予測・回収支援アプリ

## Tech Stack

- React 19 + TypeScript
- Vite 7 (PWA対応)
- Tailwind CSS 4 (ダークモード)
- Zustand (状態管理)
- Leaflet/react-leaflet (地図)
- Recharts (グラフ)
- Vitest (テスト)

## Commands

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # ESLint実行
npm run test         # テスト (watchモード)
npm run test:run     # テスト (1回実行)
npm run test:coverage # カバレッジ付きテスト
```

## Project Structure

```
src/
├── components/      # UIコンポーネント
│   ├── layout/      # AppShell等
│   ├── map/         # 地図関連
│   ├── mission/     # ミッション設定
│   ├── recovery/    # 回収支援
│   └── simulation/  # シミュレーション結果
├── physics/         # 物理エンジン
│   ├── __tests__/   # ユニットテスト
│   ├── atmosphere.ts    # ISA大気モデル
│   ├── aerodynamics.ts  # 空気力学計算
│   ├── ballistics.ts    # 上昇軌道計算
│   ├── parachute.ts     # 降下計算
│   └── windEffect.ts    # 風影響計算
├── store/           # Zustand stores
└── types/           # TypeScript型定義
```

## Testing

物理エンジン (`src/physics/`) に103のユニットテストあり:
- atmosphere.test.ts - ISA大気モデル (25テスト)
- aerodynamics.test.ts - 抗力・終端速度計算 (24テスト)
- ballistics.test.ts - 上昇軌道シミュレーション (13テスト)
- parachute.test.ts - 降下シミュレーション (19テスト)
- windEffect.test.ts - 風プロファイル・不確実性 (22テスト)

## CI/CD

- GitHub Actions: lint → test → type-check → build
- Vercel: mainブランチへのpushで自動デプロイ

## Notes

- 日本語コメント使用
- ISA (International Standard Atmosphere) 準拠
- 対流圏 (0-11km) の計算に対応
