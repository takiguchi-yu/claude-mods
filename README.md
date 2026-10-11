# claude-mods

手元で使う Claude Code の mod 置き場。このフォルダがマーケットプレイス `local-mods` になっている。

## mods

| mod | 内容 |
| --- | --- |
| [clawd-wander](clawd-wander/) | 作業中、プロンプトの上で Clawd とサブエージェントの仲間がうろうろする |
| [colorful-body](colorful-body/) | 応答の本文を glow 風に描く（見出し・インラインコード・箇条書き・表に色を付ける） |

## インストール

```bash
claude plugin marketplace add ~/git/private/claude-mods
claude plugin install <mod>@local-mods --scope user
```

プラグインはこのフォルダを直接読むので、移動・削除すると読み込まれなくなる。
編集後は各セッションで `/reload-plugins` を実行すると反映される。
