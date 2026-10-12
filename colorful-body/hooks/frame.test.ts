import { expect, test } from 'claude-code/testing'

import { frameBottom, frameRows, frameTop, frameWidth } from './frame'
import { textWidth } from './table'

test('frameWidth: fits the widest line, counts wide characters twice, caps at 80%', async () => {
  expect(frameWidth('hi', 100)).toBe(6)
  expect(frameWidth('日本語\nab', 100)).toBe(10)
  expect(frameWidth('x'.repeat(200), 100)).toBe(80)
  expect(frameWidth('x'.repeat(200), 10)).toBe(12)
})

test('frameRows: every row is exactly the inside width, wraps by cells, keeps blank lines', async () => {
  expect(frameRows('hi', 6)).toEqual(['hi'])
  expect(frameRows('a\n\nb', 6)).toEqual(['a ', '  ', 'b '])
  expect(frameRows('日本語', 8)).toEqual(['日本', '語  '])
})

test('frameRows: a space after only zero-width marks is not a word break (no overflow)', async () => {
  const text = '́ 日aáa日日日́a'
  const width = frameWidth(text, 12)
  for (const row of frameRows(text, width)) expect(textWidth(row)).toBe(width - 4)
})

test('frameRows: wraps at the last space, not mid-word', async () => {
  expect(frameRows('ab cd ef', 8)).toEqual(['ab  ', 'cd  ', 'ef  '])
})

test('frameTop / frameBottom: span the whole width', async () => {
  expect(frameTop(6)).toBe('\u{1FB7D}▔▔▔▔\u{1FB7E}')
  expect(frameBottom(6)).toBe('\u{1FB7C}▁▁▁▁\u{1FB7F}')
})
