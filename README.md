# Mypage

就職活動の経緯・意思決定・将来計画をまとめた、Astro製のポートフォリオ/キャリアレターサイトです。

## 技術スタック

- Astro 6
- JavaScript / Astro Components
- GSAP

## セットアップ

```sh
npm ci
```

## 開発コマンド

| Command | Action |
| :-- | :-- |
| `npm run dev` | 開発サーバーを起動（`http://localhost:4321`） |
| `npm run build` | 本番用ビルドを生成（`dist/`） |
| `npm run preview` | ビルド結果をローカル確認 |

## ディレクトリ構成（抜粋）

```text
/
├── public/                 # 画像などの静的アセット
├── src/
│   ├── components/         # セクション別UIコンポーネント
│   ├── layouts/            # 共通レイアウト
│   ├── pages/
│   │   └── index.astro     # トップページ
│   ├── scripts/            # アニメーション等のフロント処理
│   └── styles/             # スタイルシート
├── astro.config.mjs        # GitHub Pages向け設定（site/base）
└── package.json
```

## デプロイに関する補足

このリポジトリは `astro.config.mjs` で GitHub Pages 向けに `base: '/Mypage'` を設定しています。別URLや別リポジトリ名で公開する場合は、`site` と `base` を合わせて変更してください。
