import { expect, test } from 'claude-code/testing'

import { splitBlocks, splitSpans } from './blocks'
import { layoutTable, textWidth } from './table'

test('blocks: headings, items, tables split out; fences stay markdown; blanks normalized', async () => {
  const blocks = splitBlocks('# T\ntext **b** `c`\n- a\n  - nested\n1. one\n| A | B |\n|---|---|\n| x | `y` |\n```\n# not heading\n```')
  expect(blocks.map(b => b.kind)).toEqual([
    'heading', 'blank', 'plain', 'blank', 'item', 'item', 'item', 'blank', 'table', 'blank', 'markdown',
  ])
  expect(blocks[5]).toEqual({ kind: 'item', indent: 2, marker: '-', text: 'nested' })
  expect(blocks[8]).toEqual({ kind: 'table', rows: [['A', 'B'], ['x', '`y`']] })
})

test('a pipe line without a separator row stays markdown', async () => {
  expect(splitBlocks('| a | b |\n| c | d |').map(b => b.kind)).toEqual(['markdown'])
})

test('spans: bold may hold code; unclosed markers stay literal', async () => {
  const kinds = (t: string) => splitSpans(t).map(s => `${s.kind}${s.bold ? '+b' : ''}`)
  expect(kinds('a **b** `c` d')).toEqual(['text', 'text+b', 'text', 'code', 'text'])
  expect(kinds('**冒頭の `●`:**')).toEqual(['text+b', 'code+b', 'text+b'])
  expect(kinds('**')).toEqual(['text'])
})

test('table: wide characters count 2, header rule joins columns, narrow width wraps', async () => {
  expect(textWidth('日本a')).toBe(5)
  const text = (rows: string[][], width: number) =>
    layoutTable(rows, width).map(line => line.map(p => p.text).join(''))
  const wide = text([['タイミング', '内容'], ['x', 'y']], 80)
  expect(wide[0]).toBe(' タイミング │ 内容')
  expect(wide[1]).toBe('───────────┼─────')
  const narrow = text([['a', 'one two three four five six']], 16)
  expect(narrow.length).toBeGreaterThan(1)
  expect(narrow.every(l => textWidth(l) <= 16)).toBe(true)
})
