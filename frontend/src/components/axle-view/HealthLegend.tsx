import { HEALTH_COLORS, HEALTH_LABELS, type HealthStatus } from '@/types/axle-view'

const ORDER: HealthStatus[] = ['healthy', 'inspection_due', 'rotation_due', 'replace', 'scrapped']

export function HealthLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {ORDER.map((status) => (
        <div key={status} className="flex items-center gap-1.5 text-xs">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: HEALTH_COLORS[status] }} />
          <span className="text-muted-foreground">{HEALTH_LABELS[status]}</span>
        </div>
      ))}
    </div>
  )
}
