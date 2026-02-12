import { useState, useEffect } from 'react';
import { BASE_WIDTH, BASE_HEIGHT } from '@/game/constants';

export function useScaling() {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT)
  );

  useEffect(() => {
    const handleResize = () => {
      setScale(
        Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT)
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return scale;
}
