import type { ReactNode } from 'react';
import { useScaling } from '@/hooks/useScaling';
import styles from './ScaledContainer.module.css';

interface ScaledContainerProps {
  children: ReactNode;
}

export function ScaledContainer({ children }: ScaledContainerProps) {
  const scale = useScaling();

  return (
    <div
      className={styles.container}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
}
