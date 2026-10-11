import { expect, test } from 'claude-code/testing'

import { frameWidth } from './frame'

test('frameWidth: fits the widest line, counts wide characters twice, caps at 80%', async () => {
  expect(frameWidth('hi', 100)).toBe(6)
  expect(frameWidth('日本語\nab', 100)).toBe(10)
  expect(frameWidth('x'.repeat(200), 100)).toBe(80)
  expect(frameWidth('x'.repeat(200), 10)).toBe(12)
})
