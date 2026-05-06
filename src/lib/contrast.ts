/**
 * Pick black or white text for a coloured background based on
 * perceived luminance. Used when overlaying text on a team-colour
 * swatch.
 */
export function contrastText(hex: string): '#0f172a' | '#ffffff' {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0f172a' : '#ffffff'
}
