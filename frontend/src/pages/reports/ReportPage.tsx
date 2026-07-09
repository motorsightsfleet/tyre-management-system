import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'

import { QueryState } from '@/components/dashboard/QueryState'
import { SimpleTable } from '@/components/dashboard/SimpleTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApiQuery, extractError } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'
import type { ReportConfig } from '@/config/reports'

interface ReportResponse {
  title: string
  headings: string[]
  rows: Record<string, unknown>[]
}

export function ReportPage({ config }: { config: ReportConfig }) {
  const { data, isLoading, isError } = useApiQuery<ReportResponse>(`/reports/${config.key}`)
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null)

  async function handleExport(format: 'xlsx' | 'pdf') {
    setExporting(format)
    try {
      const res = await apiClient.get(`/reports/${config.key}/export`, { params: { format }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${config.key}-${new Date().toISOString().slice(0, 10)}.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(extractError(error))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{config.title}</h1>
        <p className="text-muted-foreground text-sm">{config.description}</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{data.rows.length} records</CardTitle>
              <CardDescription>Export this report to Excel or PDF.</CardDescription>
              <CardAction className="flex gap-2">
                <Button size="sm" variant="outline" disabled={exporting !== null} onClick={() => handleExport('xlsx')}>
                  {exporting === 'xlsx' ? <Download className="size-4 animate-bounce" /> : <FileSpreadsheet className="size-4" />}
                  Excel
                </Button>
                <Button size="sm" variant="outline" disabled={exporting !== null} onClick={() => handleExport('pdf')}>
                  {exporting === 'pdf' ? <Download className="size-4 animate-bounce" /> : <FileText className="size-4" />}
                  PDF
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <SimpleTable
                rowKey={(_row, idx) => idx}
                rows={data.rows}
                emptyLabel="No records for this report."
                columns={data.headings.map((h) => ({ key: h, header: h, render: (r: Record<string, unknown>) => formatValue(r[h]) }))}
              />
            </CardContent>
          </Card>
        )}
      </QueryState>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}
