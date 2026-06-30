# ZUMEN

誰でも簡単に既存図面を編集し、改修前・改修後の比較と簡易3Dパースを作れるブラウザアプリです。

## 実装済みの最小構成

- PNG / JPEG / PDF の図面読み込み
- 平面図編集: ズーム、ドラッグ移動、部品追加、選択、移動、削除
- Undo / Redo
- 改修前状態の保存
- 改修後状態の保存
- 改修前・改修後の左右比較、上下比較、重ね合わせ表示
- 改修後平面図と3Dパースの同時表示
- 3D表示: 鳥瞰図、アイソメ図、ウォークスルー
- JSONプロジェクト保存 / 読み込み
- PNG / PDF / Word 出力

## 技術

React、TypeScript、HTML5 Canvas、Three.js、jsPDF、docx、Vite。

## 起動

通常環境では pnpm install の後、pnpm dev で起動します。

このCodexセッションではパッケージインストール用コマンドの起動が環境ポリシーで制限されたため、ビルド確認は未実行です。

## Logo and shortcut icon

The ZUMEN logo is placed in public/zumen-logo.png. Browser tabs and PC shortcuts use public/zumen-icon-192.png and public/zumen-icon-512.png through the web manifest.
