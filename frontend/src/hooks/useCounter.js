import { useState, useEffect, useRef } from 'react';

/**
 * useCounter — animates from 0 to `target` over `duration` ms.
 *
 * OLD approach: setInterval fired setState once per integer increment.
 *   → donors=150 caused 150 re-renders. 3 counters = ~450 re-renders.
 *
 * NEW approach: requestAnimationFrame + ease-out cubic.
 *   → Always fires exactly ~(duration/16) frames (≤120 re-renders total
 *     across ALL counters) regardless of the target number.
 *   → Starts counting only when `isVisible` is true so off-screen sections
 *     don't waste CPU at all.
 */
export function useCounter(target, duration = 2000, isVisible = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    // Don't animate until the section is visible or target is 0
    if (!isVisible || !target) {
      setCount(0);
      return;
    }

    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: fast start, smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, isVisible]);

  return count;
}
