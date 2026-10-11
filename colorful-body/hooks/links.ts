import type { Span } from './blocks'

// Where `~` and relative paths resolve; either may be unknown.
export type LinkContext = { home?: string; cwd?: string }

const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g
const WHOLE_URL = /^https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/
const LINE_SUFFIX = /:\d+(:\d+)?$/
const UNSAFE = /[\s*?<>{}|"`$()\\]/

const trimUrl = (url: string): string => {
  let out = url
  for (;;) {
    const last = out[out.length - 1] ?? ''
    const isUnmatchedParen =
      last === ')' && out.split('(').length < out.split(')').length
    if ('.,;:!?\''.includes(last) || isUnmatchedParen) out = out.slice(0, -1)
    else return out
  }
}

const normalize = (path: string): string => {
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return `/${parts.join('/')}`
}

const asFileUrl = (absolute: string) => `file://${absolute.split('/').map(encodeURIComponent).join('/')}`

// The file: URL of a path-looking string (`~/a/b`, `/a/b`, `./a`, `a/b.ts`, with an
// optional :line suffix), or undefined when it does not look like a path.
export const pathHref = (raw: string, ctx: LinkContext): string | undefined => {
  const path = raw.replace(LINE_SUFFIX, '')
  if (path === '' || UNSAFE.test(path) || path.includes('://')) return undefined

  if (path.startsWith('~/')) {
    return ctx.home === undefined ? undefined : asFileUrl(normalize(`${ctx.home}/${path.slice(2)}`))
  }
  if (path.startsWith('/')) {
    return /^\/[^/]+\/./.test(path) ? asFileUrl(normalize(path)) : undefined
  }
  const isDotRelative = path.startsWith('./') || path.startsWith('../')
  const isFileLike = path.includes('/') && /\.[A-Za-z0-9]{1,8}$/.test(path)
  if ((isDotRelative || isFileLike) && ctx.cwd !== undefined) {
    return asFileUrl(normalize(`${ctx.cwd}/${path}`))
  }
  return undefined
}

// Bare URLs in plain text and path-looking inline code become links; spans that
// already carry an href are left as they are.
export const linkify = (spans: Span[], ctx: LinkContext): Span[] => {
  const out: Span[] = []
  for (const span of spans) {
    if (span.href !== undefined) {
      out.push(span)
    } else if (span.kind === 'code') {
      const href = WHOLE_URL.test(span.text) ? span.text : pathHref(span.text, ctx)
      out.push(href === undefined ? span : { ...span, href })
    } else {
      let last = 0
      for (const match of span.text.matchAll(URL_PATTERN)) {
        const url = trimUrl(match[0])
        const start = match.index ?? 0
        if (start > last) out.push({ ...span, text: span.text.slice(last, start) })
        out.push({ ...span, text: url, href: url })
        last = start + url.length
      }
      if (last < span.text.length) out.push({ ...span, text: span.text.slice(last) })
    }
  }
  return out
}
