import { useMemo } from 'react'
import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'
import { HEALTH_COLORS, type AxlePosition } from '@/types/axle-view'

interface AxleSchematicProps {
  positions: AxlePosition[]
  selectedPositionId?: number | null
  onPositionClick: (position: AxlePosition) => void
  onSwap: (fromPositionId: number, toPositionId: number) => void
}

function PositionNode({
  position,
  selected,
  onClick,
}: {
  position: AxlePosition
  selected: boolean
  onClick: () => void
}) {
  const draggable = useDraggable({
    id: `pos-${position.tyre_position_id}`,
    data: { position },
    disabled: !position.tyre,
  })
  const droppable = useDroppable({ id: `pos-${position.tyre_position_id}`, data: { position } })

  const style = draggable.transform
    ? { transform: CSS.Translate.toString(draggable.transform), zIndex: 20 }
    : undefined

  const color = position.tyre ? HEALTH_COLORS[position.tyre.health_status] : undefined

  return (
    <div
      ref={(node) => {
        draggable.setNodeRef(node)
        droppable.setNodeRef(node)
      }}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        ...style,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 touch-none"
      {...(position.tyre ? draggable.listeners : undefined)}
      {...(position.tyre ? draggable.attributes : undefined)}
    >
      <button
        type="button"
        onClick={onClick}
        title={position.tyre ? `${position.code} — ${position.tyre.serial_number}` : `${position.code} — empty`}
        className={cn(
          'flex size-11 flex-col items-center justify-center rounded-full border-2 text-[9px] leading-none font-semibold text-white shadow-md transition-all duration-200 ease-out hover:scale-110 sm:size-12',
          droppable.isOver && 'ring-primary/50 scale-110 ring-4',
          selected && 'glow-selected scale-110',
          !position.tyre && 'border-dashed border-muted-foreground/40 bg-muted text-muted-foreground'
        )}
        style={position.tyre ? { backgroundColor: color, borderColor: color } : undefined}
      >
        {position.is_spare ? 'SP' : position.code}
      </button>
    </div>
  )
}

export function AxleSchematic({ positions, selectedPositionId, onPositionClick, onSwap }: AxleSchematicProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const axleLines = useMemo(() => {
    const byAxle = new Map<number, AxlePosition[]>()
    for (const p of positions) {
      if (p.is_spare) continue
      if (!byAxle.has(p.axle_no)) byAxle.set(p.axle_no, [])
      byAxle.get(p.axle_no)!.push(p)
    }
    return Array.from(byAxle.entries()).map(([axleNo, pts]) => {
      const y = pts[0].y
      const xs = pts.map((p) => p.x)
      return { axleNo, y, x1: Math.min(...xs), x2: Math.max(...xs) }
    })
  }, [positions])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromPosition = (active.data.current?.position as AxlePosition | undefined)?.tyre_position_id
    const toPosition = (over.data.current?.position as AxlePosition | undefined)?.tyre_position_id

    if (fromPosition && toPosition) {
      onSwap(fromPosition, toPosition)
    }
  }

  return (
    <div className="bg-card relative mx-auto aspect-[3/5] w-full max-w-xs rounded-2xl border-2 border-dashed p-4 sm:max-w-sm">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <rect x="15%" y="2%" width="70%" height="96%" rx="24" className="fill-muted/40 stroke-border" strokeWidth={2} />
        {axleLines.map((line) => (
          <line
            key={line.axleNo}
            x1={`${line.x1}%`}
            y1={`${line.y}%`}
            x2={`${line.x2}%`}
            y2={`${line.y}%`}
            className="stroke-border"
            strokeWidth={3}
          />
        ))}
      </svg>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {positions.map((position) => (
          <PositionNode
            key={position.tyre_position_id}
            position={position}
            selected={position.tyre_position_id === selectedPositionId}
            onClick={() => onPositionClick(position)}
          />
        ))}
      </DndContext>
    </div>
  )
}
