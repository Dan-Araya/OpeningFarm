// frontend/src/hooks/useContainerMeasure.ts
import { useRef, useState, useEffect } from 'react';

export const useContainerMeasure = <T extends HTMLElement = HTMLDivElement>() => {
    const ref = useRef<T>(null);
    const [bounds, setBounds] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setBounds({ width, height });
        });

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, []); // Empty dependency array means this effect runs once on mount

    return [ref, bounds] as const;
};