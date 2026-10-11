import { splitSpans } from './blocks'
import { linkify } from './links'
import type { LinkContext } from './links'

// A table drawn as glow draws it: header, a ─┼─ rule, rows split by │, cells
// wrapped to column widths counted in terminal cells (wide characters = 2).
export type Piece = { text: string; kind: 'text' | 'code'; bold: boolean; href?: string }
export type Line = Piece[]

export const cellWidth = (ch: string): number => {
  const c = ch.codePointAt(0) ?? 0
  if (c === 0 || (c >= 0x300 && c <= 0x36f) || c === 0x200d || (c >= 0xfe00 && c <= 0xfe0f)) return 0
  const isWide =
    (c >= 0x1100 && c <= 0x115f) ||
    (c >= 0x2e80 && c <= 0xa4cf) ||
    (c >= 0xac00 && c <= 0xd7a3) ||
    (c >= 0xf900 && c <= 0xfaff) ||
    (c >= 0xfe30 && c <= 0xfe6f) ||
    (c >= 0xff00 && c <= 0xff60) ||
    (c >= 0xffe0 && c <= 0xffe6) ||
    (c >= 0x1f300 && c <= 0x1faff) ||
    (c >= 0x20000 && c <= 0x3fffd) ||
    c === 0x2705 || c === 0x274c
  return isWide ? 2 : 1
}

export const textWidth = (text: string): number => {
  let width = 0
  for (const ch of text) width += cellWidth(ch)
  return width
}

const lineWidth = (line: Line) => line.reduce((sum, piece) => sum + textWidth(piece.text), 0)

const piecesOf = (cell: string, ctx: LinkContext | undefined): Piece[] =>
  (ctx === undefined ? splitSpans(cell) : linkify(splitSpans(cell), ctx)).map(span => ({
    kind: span.kind,
    bold: span.bold,
    text: span.kind === 'code' ? ` ${span.text} ` : span.text,
    ...(span.href === undefined ? {} : { href: span.href }),
  }))

// Greedy wrap over characters; a break prefers the last space on the line.
const wrapCell = (cell: string, width: number, ctx: LinkContext | undefined): Line[] => {
  const chars: { ch: string; piece: Piece }[] = []
  for (const piece of piecesOf(cell, ctx)) for (const ch of piece.text) chars.push({ ch, piece })

  const rows: { ch: string; piece: Piece }[][] = []
  let row: { ch: string; piece: Piece }[] = []
  let used = 0
  for (const entry of chars) {
    const w = cellWidth(entry.ch)
    if (used + w > width && row.length > 0) {
      const space = row.map(r => r.ch).lastIndexOf(' ')
      if (entry.ch !== ' ' && space > 0) {
        rows.push(row.slice(0, space))
        row = row.slice(space + 1)
      } else {
        rows.push(row)
        row = []
      }
      used = row.reduce((sum, r) => sum + cellWidth(r.ch), 0)
      if (entry.ch === ' ' && row.length === 0) continue
    }
    row.push(entry)
    used += w
  }
  rows.push(row)

  return rows.map(r => {
    const line: Line = []
    for (const { ch, piece } of r) {
      const last = line[line.length - 1]
      if (last !== undefined && last.kind === piece.kind && last.bold === piece.bold && last.href === piece.href) last.text += ch
      else line.push({ kind: piece.kind, bold: piece.bold, text: ch, ...(piece.href === undefined ? {} : { href: piece.href }) })
    }
    return line
  })
}

const plain = (text: string): Piece => ({ text, kind: 'text', bold: false })

// ctx undefined: links off (no bare URL or path detection).
export const layoutTable = (rows: string[][], available: number, ctx?: LinkContext): Line[] => {
  const columns = Math.max(...rows.map(r => r.length))
  const natural = Array.from({ length: columns }, (_, c) =>
    Math.max(1, ...rows.map(r => lineWidth(piecesOf(r[c] ?? '', ctx)))),
  )
  const widths = [...natural]
  const free = available - 1 - 3 * (columns - 1)
  while (widths.reduce((a, b) => a + b, 0) > free) {
    const widest = widths.indexOf(Math.max(...widths))
    if ((widths[widest] ?? 0) <= 4) break
    widths[widest] = (widths[widest] ?? 0) - 1
  }

  const out: Line[] = []
  rows.forEach((row, rowIndex) => {
    const cells = widths.map((w, c) => wrapCell(row[c] ?? '', w, ctx))
    const height = Math.max(...cells.map(c => c.length))
    for (let l = 0; l < height; l++) {
      const line: Line = [plain(' ')]
      cells.forEach((cell, c) => {
        const part = cell[l] ?? []
        line.push(...part, plain(' '.repeat(Math.max(0, (widths[c] ?? 0) - lineWidth(part)))))
        if (c < columns - 1) line.push(plain(' │ '))
      })
      out.push(line)
    }
    if (rowIndex === 0) {
      const rule = widths
        .map((w, c) => '─'.repeat(w + (c === columns - 1 && columns > 1 ? 1 : 2)))
        .join('┼')
      out.push([plain(rule)])
    }
  })
  return out
}
