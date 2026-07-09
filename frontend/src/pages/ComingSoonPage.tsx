import { Construction } from 'lucide-react'

export function ComingSoonPage({ title }: { title?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <Construction className="text-muted-foreground size-6" />
      </div>
      <h2 className="text-lg font-semibold">{title ?? 'Coming soon'}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">This screen is being built out and will be available shortly.</p>
    </div>
  )
}
