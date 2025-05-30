# ctx-helper

ctx-helperは、Electronアプリケーションでのコンテキスト分離やIPC通信を簡単に管理するためのヘルパーライブラリです。

## インストール

```bash
npm install ctx-hepler
```

## 主な機能

### IPC通信の管理

[`ipcManager`](src/common/ipcManager.ts) を使うことで、RendererプロセスでのIPCイベントの登録・解除・一度だけのリッスンが簡単にできます。

```ts
import { ipcManager } from 'ctx-helper'

// リスナー登録
const unsubscribe = ipcManager.on('channel', (...args) => {
  // 受信処理
})

// リスナー解除
unsubscribe()

// 一度だけのリスン
ipcManager.once('channel', (...args) => {
  // 1回だけ受信
})
```

### API管理

[`apiManager`](src/preload/index.ts) を使うことで、Main/PreloadプロセスでAPIハンドラやリスナーの登録、Renderer側からのAPI呼び出し・イベント送信ができます。

```ts
import { apiManager } from 'ctx-helper'

// ハンドラ登録（Main/Preload）
apiManager.registerHandler('handlerName', async (sender, ...args) => {
  // ...
})

// リスナー登録（Main/Preload）
apiManager.registerListener('listenerName', async (...args) => {
  // ...
})

// RendererからAPI呼び出し
const invoker = apiManager.createAPIInvoker()
await invoker.handlerName(args)

// Rendererからイベント送信
const emitter = apiManager.createAPIEmitter()
emitter.listenerName(args)
```

### 型定義

APIレスポンスやステータス管理のための型定義も提供しています。

- [`APIRecord`](src/types/index.ts)
- [`Status`](src/types/index.ts)
- [`APISchema`](src/types/index.ts)
- [`AsyncFunction`](src/types/index.ts)
- [`RecursiveAPI`](src/types/index.ts)
- [`RecursiveListener`](src/types/index.ts)
- [`StatusSchema`](src/types/index.ts)

## コントリビュート

バグ報告・機能要望・プルリクエストは歓迎します。  
以下の手順で開発・コントリビュートできます。

1. このリポジトリをフォークし、ローカルにクローンしてください。
2. 依存パッケージをインストールします。
   ```bash
   bun install
   ```
3. ブランチを作成し、修正や機能追加を行ってください。
4. テストを実行して動作確認します。
   ```bash
   bun run test
   ```
5. 変更内容をコミットし、GitHubでプルリクエストを作成してください。

質問や相談もIssueでお気軽にどうぞ！

## ライセンス

MIT

---
詳細は各ファイルのコメントやテストコードもご参照ください。
