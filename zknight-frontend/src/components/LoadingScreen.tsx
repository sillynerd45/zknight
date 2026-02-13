import { useState, useEffect, type ReactNode } from 'react';
import { preloadSprites } from '@/sprites/preload';

interface LoadingScreenProps {
    children: ReactNode;
}

export function LoadingScreen({ children }: LoadingScreenProps) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        preloadSprites().then(() => setReady(true));
    }, []);

    if (!ready) {
        return (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontFamily: 'var(--font-body, sans-serif)',
                }}
            >
                Loading sprites...
            </div>
        );
    }

    return <>{children}</>;
}
