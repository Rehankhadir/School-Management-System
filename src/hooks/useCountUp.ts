import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration = 1500, startOnMount = true) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null as number | null);
  const animationFrame = useRef<number>(0);

  useEffect(() => {
    if (!startOnMount) return;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * end));
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [end, duration, startOnMount]);

  return count;
}
