// 8-color palette for charts using HSL values that work in both light and dark modes.
// Uses zinc-based palette matching the radix-vega theme.
export const CHART_COLORS = [
  'hsl(220, 70%, 55%)',   // blue
  'hsl(160, 60%, 45%)',   // teal
  'hsl(280, 60%, 55%)',   // purple
  'hsl(30, 80%, 55%)',    // orange
  'hsl(340, 65%, 55%)',   // pink
  'hsl(190, 70%, 45%)',   // cyan
  'hsl(50, 75%, 50%)',    // yellow
  'hsl(100, 50%, 45%)',   // green
] as const;

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
