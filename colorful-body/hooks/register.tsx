import type { Register } from 'claude-code'

import { splitBlocks, splitSpans } from './blocks'
import { layoutTable } from './table'

// Colors follow glow's dark style (glamour): xterm-256 numbers in the comments.
const H1_COLOR = '#ffffaf' // 228
const H1_BACKGROUND = '#5f5fff' // 63
const HEADING_COLOR = '#00afff' // 39
const CODE_COLOR = '#ff5f5f' // 203
const CODE_BACKGROUND = '#303030' // 236

export const register: Register = on => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    // Summaries and rewritten rows keep the engine's own drawing.
    if (e.props.isSummary) {
      return next(e)
    }

    const { Box, Text, Markdown } = $.ui.resolve(e)
    const blocks = splitBlocks(e.props.text)
    const available = (e.viewport?.columns ?? 100) - 4

    const spans = (text: string) =>
      splitSpans(text).map((span, j) =>
        span.kind === 'code' ? (
          <Text key={`s${j}`} bold={span.bold} color={CODE_COLOR} backgroundColor={CODE_BACKGROUND}>
            {` ${span.text} `}
          </Text>
        ) : (
          <Text key={`s${j}`} bold={span.bold}>{span.text}</Text>
        ),
      )

    const body = (
      <Box flexDirection="column" flexGrow={1}>
        {blocks.map((block, i) => {
          switch (block.kind) {
            case 'heading':
              return block.level === 1 ? (
                <Box key={`b${i}`}>
                  <Text bold color={H1_COLOR} backgroundColor={H1_BACKGROUND}>
                    {` ${block.text} `}
                  </Text>
                </Box>
              ) : (
                <Text key={`b${i}`} bold color={HEADING_COLOR}>
                  {`${'#'.repeat(block.level)} ${block.text}`}
                </Text>
              )
            case 'item':
              return (
                <Box key={`b${i}`}>
                  <Box paddingLeft={block.indent} flexShrink={0}>
                    <Text>{/^[-*+]$/.test(block.marker) ? '• ' : `${block.marker} `}</Text>
                  </Box>
                  <Box flexGrow={1}>
                    <Text>{spans(block.text)}</Text>
                  </Box>
                </Box>
              )
            case 'table':
              return (
                <Box key={`b${i}`} flexDirection="column">
                  {layoutTable(block.rows, available).map((line, l) => (
                    <Text key={`l${l}`}>
                      {line.map((piece, p) =>
                        piece.kind === 'code' ? (
                          <Text key={`p${p}`} bold={piece.bold} color={CODE_COLOR} backgroundColor={CODE_BACKGROUND}>
                            {piece.text}
                          </Text>
                        ) : (
                          <Text key={`p${p}`} bold={piece.bold}>{piece.text}</Text>
                        ),
                      )}
                    </Text>
                  ))}
                </Box>
              )
            case 'blank':
              return <Text key={`b${i}`}> </Text>
            case 'markdown':
              return <Markdown key={`b${i}`} text={block.text} />
            case 'plain':
              return <Text key={`b${i}`}>{spans(block.text)}</Text>
          }
        })}
      </Box>
    )

    // Seen in use: the engine's opening bullet is not drawn around a plugin's tree, so redraw it.
    return e.props.isFirstOfReply ? (
      <Box>
        <Box flexShrink={0}>
          <Text>● </Text>
        </Box>
        {body}
      </Box>
    ) : (
      body
    )
  })
}
