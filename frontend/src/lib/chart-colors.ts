export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}
