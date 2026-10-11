# clawd-wander 開発メモ

## 開発コマンド

```bash
claude plugin validate clawd-wander   # フックするイベントと呼ぶ機能を確かめる
claude plugin test clawd-wander
```

振る舞いの仕様はリポジトリ直下の `.scratch/` にある。
README の GIF は [vhs](https://github.com/charmbracelet/vhs) で撮っている。撮り直す手順は `screenshots/clawd-wander.tape` の冒頭にある。

## 仕組み

フックするイベントは 4 つ。

- `ui.render`: プロンプト上の帯 `AbovePrompt` に絵を描く
- `tool.call`: ツール名・呼び出し元のエージェント・Bash のコマンドと成否を見て、持つ道具と居眠り・驚き・紙吹雪を決める
- `agent.spawn`: サブエージェントの仲間を増やす
- `session.compact`: 会話の圧縮の始まりと終わりを見て、マスコットをつぶす・戻す

使うエンジンの機能: `$.agent.list`（動いているサブエージェントの一覧。1 秒ごと）、`$.clock`（100 ms ごとのタイマー）、`$.ui.blit`・`$.ui.invalidate`・`$.ui.resolve`（帯の描画）。

## しないこと

- ツールの呼び出しや会話の圧縮を止めたり、書き換えたりしない。結果もそのまま返す
- 通信しない。ファイルを読み書きしない。コマンドを実行しない
- 見たコマンドやエージェントの情報を保存・送信しない（道具を決めたら捨てる）
