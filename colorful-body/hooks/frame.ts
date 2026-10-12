import { cellWidth, textWidth } from './table'

// A frame around the prompt, sized to its text and capped at 80% of the screen.
// Width = widest line + 2 (border) + 2 (padding), counted in terminal cells.
export const frameWidth = (text: string, columns: number): number => {
  const widest = Math.max(1, ...text.split('\n').map(textWidth))
  const cap = Math.max(12, Math.floor(columns * 0.8))
  return Math.min(cap, widest + 4)
}

// The engine's border leaves its own cells unpainted, so the frame is drawn as
// plain rows and every cell, border included, can carry the background. Lines
// are one-eighth blocks hugging the outer edge of their cell: a box-drawing
// line sits mid-cell and leaves background showing outside it.
export const FRAME_LEFT = '▏'
export const FRAME_RIGHT = '▕'
// The corners are the L-shaped eighth blocks (Symbols for Legacy Computing), so
// the side lines run through the top and bottom rows up to the horizontal line.
export const frameTop = (width: number): string => `\u{1FB7D}${'▔'.repeat(width - 2)}\u{1FB7E}`
export const frameBottom = (width: number): string => `\u{1FB7C}${'▁'.repeat(width - 2)}\u{1FB7F}`

// Greedy wrap in terminal cells; a break prefers the last space on the row.
const wrapLine = (line: string, width: number): string[] => {
  const rows: string[] = []
  let row = ''
  let used = 0
  for (const ch of line) {
    const w = cellWidth(ch)
    if (used + w > width && row !== '') {
      const space = row.lastIndexOf(' ')
      // A prefix of zero-width marks only is not a word: break there and the rest still overflows.
      if (ch !== ' ' && space > 0 && textWidth(row.slice(0, space)) > 0) {
        rows.push(row.slice(0, space))
        row = row.slice(space + 1)
      } else {
        rows.push(row)
        row = ''
      }
      if (ch === ' ' && row === '') continue
    }
    row += ch
    used = textWidth(row)
  }
  rows.push(row)
  return rows
}

// The text rows between the side borders: wrapped to the inside of the frame
// and padded with spaces to exactly `width - 4` cells.
export const frameRows = (text: string, width: number): string[] => {
  const inside = width - 4
  return text
    .split('\n')
    .flatMap(line => wrapLine(line, inside))
    .map(row => row + ' '.repeat(inside - textWidth(row)))
}
