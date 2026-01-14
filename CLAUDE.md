# Rocket Recovery App

モデルロケットの軌道予測・回収支援アプリ

## Tech Stack

- React 19 + TypeScript
- Vite 7 (PWA対応)
- Tailwind CSS 4 (ダークモード)
- Zustand (状態管理)
- Leaflet/react-leaflet (2D地図)
- Three.js/react-three-fiber (3D表示)
- Recharts (グラフ)
- Vitest (ユニットテスト)
- Playwright (E2Eテスト)

## Commands

```bash
npm run dev           # 開発サーバー起動
npm run build         # 本番ビルド
npm run lint          # ESLint実行
npm run test          # ユニットテスト (watchモード)
npm run test:run      # ユニットテスト (1回実行)
npm run test:coverage # カバレッジ付きテスト
npm run test:e2e      # E2Eテスト (ヘッドレス)
npm run test:e2e:ui   # E2Eテスト (UIモード)
```

## Project Structure

```
src/
├── components/      # UIコンポーネント
│   ├── layout/      # AppShell等
│   ├── map/         # 地図関連
│   ├── mission/     # ミッション設定
│   ├── recovery/    # 回収支援
│   └── simulation/  # シミュレーション結果 + 3D表示
├── physics/         # 物理エンジン
│   ├── __tests__/   # ユニットテスト
│   ├── atmosphere.ts    # ISA大気モデル
│   ├── aerodynamics.ts  # 空気力学計算
│   ├── ballistics.ts    # 上昇軌道計算
│   ├── parachute.ts     # 降下計算
│   └── windEffect.ts    # 風影響計算
├── services/        # 外部サービス連携
│   ├── weather/     # Open-Meteo天気API
│   └── trajectory/  # 軌道計算サービス
├── store/           # Zustand stores
└── types/           # TypeScript型定義
e2e/                 # Playwright E2Eテスト
```

## Testing

**ユニットテスト** (103テスト):
- atmosphere.test.ts - ISA大気モデル
- aerodynamics.test.ts - 抗力・終端速度計算
- ballistics.test.ts - 上昇軌道シミュレーション
- parachute.test.ts - 降下シミュレーション
- windEffect.test.ts - 風プロファイル・不確実性

**E2Eテスト** (10テスト):
- basic-flow.spec.ts - 基本フロー
- weather-api.spec.ts - 天気API連携
- view-toggle.spec.ts - 2D/3D切り替え

## Features

- **天気API連携**: Open-Meteoから風速・気温・気圧を自動取得
- **3D軌道表示**: Three.jsで軌道を3D可視化、マウス操作で視点変更
- **2D地図表示**: Leafletで軌道・着地点・不確実性楕円を表示

## CI/CD

- GitHub Actions: lint → test → type-check → build
- Vercel: mainブランチへのpushで自動デプロイ
- **pre-commit hook**: husky + lint-staged でコミット前に自動lint

## Notes

- 日本語コメント使用
- ISA (International Standard Atmosphere) 準拠
- 対流圏 (0-11km) の計算に対応
