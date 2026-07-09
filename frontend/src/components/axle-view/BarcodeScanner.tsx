import { useEffect, useRef, useState } from 'react'
import { CameraOff } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null)

  useEffect(() => {
    if (!active) return

    let cancelled = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled || !containerRef.current) return

      const id = 'barcode-scanner-region'
      containerRef.current.id = id
      const scanner = new Html5Qrcode(id)
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            onDetected(decodedText)
            scanner.stop().catch(() => {})
            setActive(false)
          },
          () => {}
        )
        .catch(() => setError('Could not access camera. Check permissions or use manual entry.'))
    })

    return () => {
      cancelled = true
      scannerRef.current?.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  if (!active) {
    return (
      <Button type="button" variant="outline" onClick={() => setActive(true)}>
        Scan barcode / QR
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="bg-muted mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-lg" />
      {error && (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <CameraOff className="size-3.5" /> {error}
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={() => setActive(false)}>
        Cancel scan
      </Button>
    </div>
  )
}
