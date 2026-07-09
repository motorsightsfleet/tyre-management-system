import { useState } from 'react'
import { Search, Barcode as BarcodeIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarcodeScanner } from '@/components/axle-view/BarcodeScanner'
import { TyreDetailPanel } from '@/components/axle-view/TyreDetailPanel'
import { apiClient } from '@/lib/api-client'
import { extractError } from '@/hooks/use-crud'

interface FoundTyre {
  id: number
  serial_number: string
  barcode_code: string | null
  status: string
  tyre_brand?: { name: string }
}

export function BarcodeRfidPage() {
  const [code, setCode] = useState('')
  const [found, setFound] = useState<FoundTyre | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function lookup(lookupCode: string) {
    if (!lookupCode) return
    setLoading(true)
    try {
      const res = await apiClient.get('/master-data/tyres/lookup', { params: { code: lookupCode } })
      setFound(res.data.data)
    } catch (error) {
      setFound(null)
      toast.error(extractError(error))
    } finally {
      setLoading(false)
    }
  }

  async function generateBarcode(tyreId: number) {
    try {
      const res = await apiClient.post(`/master-data/tyres/${tyreId}/generate-barcode`)
      setFound(res.data.data)
      toast.success('Barcode generated')
    } catch (error) {
      toast.error(extractError(error))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Barcode / RFID Management</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Look up a tyre</CardTitle>
          <CardDescription>Scan a barcode/QR code or enter it manually to find a tyre.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <BarcodeScanner onDetected={(c) => { setCode(c); lookup(c) }} />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input placeholder="Barcode / serial number" className="pl-8" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <Button onClick={() => lookup(code)} disabled={loading}>
              Search
            </Button>
          </div>

          {found && (
            <div className="mt-2 flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {found.serial_number}
                  <Badge variant={found.status === 'installed' ? 'success' : 'secondary'}>{found.status.replace('_', ' ')}</Badge>
                </p>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <BarcodeIcon className="size-3" />
                  {found.barcode_code ?? 'No barcode assigned'}
                </p>
              </div>
              <div className="flex gap-2">
                {!found.barcode_code && (
                  <Button size="sm" variant="outline" onClick={() => generateBarcode(found.id)}>
                    Generate Barcode
                  </Button>
                )}
                <Button size="sm" onClick={() => setDetailOpen(true)}>
                  View Details
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TyreDetailPanel tyreId={found?.id ?? null} open={detailOpen} onOpenChange={setDetailOpen} onRemove={() => {}} />
    </div>
  )
}
