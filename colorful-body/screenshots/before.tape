# README の before.png を撮り直す vhs のスクリプト。リポジトリ直下で実行する。
# 撮影用の返答は colorful-body/screenshots/sample.md をそのまま返させている。
#   vhs colorful-body/screenshots/before.tape
#   ffmpeg -y -sseof -2 -i /tmp/colorful-body-before.mp4 -frames:v 1 -vf crop=1200:580:0:0 colorful-body/screenshots/before.png
# 録画は返答が出た直後で止めるので、最後に近いフレームを 1 枚切り出す。crop は入力欄に出る提案文（会話の履歴から作られる）を切り落とす。
Output "/tmp/colorful-body-before.mp4"
Set Shell zsh
Set FontSize 15
Set Width 1200
Set Height 820
Set Framerate 20
Set Padding 16
Set TypingSpeed 10ms

# Claude Code の中から実行したときに引き継ぐ変数と、利用状況が映るステータスラインを外す
Hide
Type "unset CLAUDE_CODE_CHILD_SESSION CLAUDE_CODE_SESSION_ID CLAUDE_CODE_MESSAGING_SOCKET CLAUDE_CODE_MESSAGING_TOKEN CLAUDE_CODE_ENTRYPOINT CLAUDE_CODE_EXECPATH CLAUDE_CODE_SESSION_ATTENDED && clear"
Enter
Type `claude --model sonnet --settings '{"statusLine":{"type":"command","command":"true"},"enabledPlugins":{"colorful-body@local-mods":false}}' --allowedTools Read`
Enter
Sleep 10s
Show
Type "Read colorful-body/screenshots/sample.md and reply with its contents verbatim as Markdown, not inside a code block. Say nothing else."
Sleep 500ms
Enter
Sleep 12s
Hide
Ctrl+C
Ctrl+C
