export type HealthStatus = 'healthy' | 'inspection_due' | 'rotation_due' | 'replace' | 'scrapped'

export interface AxleTyreSummary {
  id: number
  serial_number: string
  barcode_code: string | null
  brand: string | null
  pattern: string | null
  size: string | null
  status: string
  health_status: HealthStatus
}

export interface AxlePosition {
  tyre_position_id: number
  code: string
  axle_no: number
  side: 'left' | 'right'
  is_dual: boolean
  is_spare: boolean
  x: number
  y: number
  tyre: AxleTyreSummary | null
}

export interface AxleViewVehicle {
  id: number
  code: string
  plate_number: string | null
  odometer_km: number
  engine_hours: number
  status: string
  vehicle_model?: { name: string }
  vehicle_category?: { name: string }
  axle_configuration?: { name: string; axle_count: number }
}

export interface AxleViewResponse {
  vehicle: AxleViewVehicle
  positions: AxlePosition[]
}

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: 'var(--color-status-healthy)',
  inspection_due: 'var(--color-status-inspection-due)',
  rotation_due: 'var(--color-status-rotation-due)',
  replace: 'var(--color-status-replace)',
  scrapped: 'var(--color-status-scrapped)',
}

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  inspection_due: 'Inspection Due',
  rotation_due: 'Rotation Due',
  replace: 'Replacement Required',
  scrapped: 'Scrapped',
}
