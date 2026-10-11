import { textWidth } from './table'

// A frame around the prompt, sized to its text and capped at 80% of the screen.
// Width = widest line + 2 (border) + 2 (padding), counted in terminal cells.
export const frameWidth = (text: string, columns: number): number => {
  const widest = Math.max(1, ...text.split('\n').map(textWidth))
  const cap = Math.max(12, Math.floor(columns * 0.8))
  return Math.min(cap, widest + 4)
}
