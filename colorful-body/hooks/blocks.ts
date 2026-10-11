// Splits a reply's markdown into blocks the mod draws itself (headings, plain
// lines, list items, tables) and blocks left to the engine's own Markdown
// renderer (fences, quotes), so the layout of those is not rebuilt here.
export type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'plain'; text: string }
  | { kind: 'item'; indent: number; marker: string; text: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'markdown'; text: string }
  | { kind: 'blank' }

export type Span = { kind: 'text' | 'code'; bold: boolean; text: string }

const HEADING = /^(#{1,6})\s+(.*)$/
const FENCE = /^\s*(```|~~~)/
const ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/
const STRUCTURED = /^\s*>/
const TABLE_LINE = /^\s*\|.*\|\s*$/

export const splitRow = (line: string): string[] => {
  const cells: string[] = []
  let cell = ''
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  for (let i = 0; i < body.length; i++) {
    const ch = body[i] ?? ''
    if (ch === '\\' && body[i + 1] === '|') {
      cell += '|'
      i += 1
    } else if (ch === '|') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell.trim())
  return cells
}

const isSeparatorRow = (cells: string[]) => cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c))

const groupOf = (block: Block) => (block.kind === 'plain' ? 'plain' : block.kind)

// Blank lines between unlike blocks, as glow spaces them; none at either end.
const spaced = (blocks: Block[]): Block[] => {
  const out: Block[] = []
  for (const block of blocks) {
    const last = out[out.length - 1]
    if (block.kind === 'blank') {
      if (last !== undefined && last.kind !== 'blank') out.push(block)
    } else if (last !== undefined && last.kind !== 'blank' && groupOf(last) !== groupOf(block)) {
      out.push({ kind: 'blank' }, block)
    } else {
      out.push(block)
    }
  }
  while (out[out.length - 1]?.kind === 'blank') out.pop()
  return out
}

export const splitBlocks = (source: string): Block[] => {
  const blocks: Block[] = []
  const lines = source.split('\n')
  let inFence = false

  const pushMarkdown = (line: string) => {
    const last = blocks[blocks.length - 1]
    if (last?.kind === 'markdown') {
      last.text += `\n${line}`
    } else {
      blocks.push({ kind: 'markdown', text: line })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (inFence || FENCE.test(line)) {
      if (FENCE.test(line)) inFence = !inFence
      pushMarkdown(line)
      continue
    }
    if (TABLE_LINE.test(line)) {
      let end = i
      while (end + 1 < lines.length && TABLE_LINE.test(lines[end + 1] ?? '')) end += 1
      const rows = lines.slice(i, end + 1).map(splitRow)
      if (rows.length >= 2 && isSeparatorRow(rows[1] ?? [])) {
        blocks.push({ kind: 'table', rows: [rows[0] ?? [], ...rows.slice(2)] })
      } else {
        for (const raw of lines.slice(i, end + 1)) pushMarkdown(raw)
      }
      i = end
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1]?.length ?? 2, text: heading[2] ?? '' })
    } else if (line.trim() === '') {
      blocks.push({ kind: 'blank' })
    } else if (ITEM.test(line)) {
      const [, pad = '', marker = '-', text = ''] = ITEM.exec(line) ?? []
      blocks.push({ kind: 'item', indent: pad.length, marker, text })
    } else if (STRUCTURED.test(line) || /^\s{2,}\S/.test(line)) {
      pushMarkdown(line)
    } else {
      blocks.push({ kind: 'plain', text: line })
    }
  }

  return spaced(blocks)
}

// Inline scanner: **bold** may hold `code`; an unclosed marker stays literal.
export const splitSpans = (line: string): Span[] => {
  const spans: Span[] = []
  let buffer = ''
  let isBold = false

  const flush = () => {
    if (buffer !== '') spans.push({ kind: 'text', bold: isBold, text: buffer })
    buffer = ''
  }

  for (let i = 0; i < line.length; i++) {
    const ch = line[i] ?? ''
    if (line.startsWith('**', i) && (isBold || line.indexOf('**', i + 2) > i + 2)) {
      flush()
      isBold = !isBold
      i += 1
    } else if (ch === '`' && line.indexOf('`', i + 1) > i + 1) {
      flush()
      const end = line.indexOf('`', i + 1)
      spans.push({ kind: 'code', bold: isBold, text: line.slice(i + 1, end) })
      i = end
    } else {
      buffer += ch
    }
  }
  flush()
  return spans
}
