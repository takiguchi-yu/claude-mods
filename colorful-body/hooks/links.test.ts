import { expect, test } from 'claude-code/testing'

import { splitSpans } from './blocks'
import { linkify, pathHref } from './links'

const ctx = { home: '/Users/me', cwd: '/Users/me/work/app' }

test('pathHref: home, absolute, dot-relative and file-like relative paths', async () => {
  expect(pathHref('~/git/ab', ctx)).toBe('file:///Users/me/git/ab')
  expect(pathHref('~/.claude/settings.json', ctx)).toBe('file:///Users/me/.claude/settings.json')
  expect(pathHref('/Users/me/x.md', ctx)).toBe('file:///Users/me/x.md')
  expect(pathHref('./src/a.ts', ctx)).toBe('file:///Users/me/work/app/src/a.ts')
  expect(pathHref('../b/c.ts', ctx)).toBe('file:///Users/me/work/b/c.ts')
  expect(pathHref('colorful-body/hooks/links.ts:42:7', ctx)).toBe('file:///Users/me/work/app/colorful-body/hooks/links.ts')
  expect(pathHref('日本/メモ.md', ctx)).toBe(`file:///Users/me/work/app/${encodeURIComponent('日本')}/${encodeURIComponent('メモ.md')}`)
})

test('pathHref: things that only look like paths stay text', async () => {
  for (const raw of ['/compact', '/theme', 'a/b', 'foo', 'src/*.ts', 'a b/c.ts', 'https://x.dev/a.ts', '~', 'fn(x)/y.ts']) {
    expect(pathHref(raw, ctx)).toBeUndefined()
  }
  expect(pathHref('~/a/b', {})).toBeUndefined()
  expect(pathHref('./a.ts', { home: '/h' })).toBeUndefined()
})

test('linkify: bare URLs lose trailing punctuation and stop at non-ASCII', async () => {
  const out = linkify(splitSpans('見て https://example.com/a?b=1. 次に(https://x.dev/p)と、'), ctx)
  expect(out.filter(s => s.href).map(s => s.href)).toEqual(['https://example.com/a?b=1', 'https://x.dev/p'])
  expect(out.map(s => s.text).join('')).toBe('見て https://example.com/a?b=1. 次に(https://x.dev/p)と、')
})

test('linkify: inline code that is a path or URL becomes a link; markdown links keep their label', async () => {
  const code = linkify(splitSpans('`~/.claude/a.json` と `https://x.dev` と `npm run x`'), ctx)
  expect(code.filter(s => s.kind === 'code').map(s => s.href)).toEqual(['file:///Users/me/.claude/a.json', 'https://x.dev', undefined])
  const md = splitSpans('**[docs](https://x.dev/d)** です')
  expect(md[0]).toEqual({ kind: 'text', bold: true, text: 'docs', href: 'https://x.dev/d' })
  expect(splitSpans('[a](ftp://x)').map(s => s.href)).toEqual([undefined])
})
