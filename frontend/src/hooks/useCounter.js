import { useState, useEffect } from 'react'

export function useCounter(target, duration = 3000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const stepTime = Math.abs(Math.floor(duration / target))
    const interval = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= target) clearInterval(interval)
    }, stepTime)

    return () => clearInterval(interval)
  }, [target, duration])

  return count
}
