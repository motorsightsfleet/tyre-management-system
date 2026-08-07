import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from its previous value to `target` over `duration` ms.
 * Non-numeric values (already-formatted strings like "Rp 1,234") pass through untouched.
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    const start = performance.now()
    cancelAnimationFrame(frameRef.current)

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(from + (target - from) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}
