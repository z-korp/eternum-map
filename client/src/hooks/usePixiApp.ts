import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export function usePixiApp(containerRef: React.RefObject<HTMLDivElement>) {
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    appRef.current = app;

    const initializePixi = async () => {
      await app.init({
        background: 0xffffff,
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      }
    };

    initializePixi();

    return () => {
      app.destroy(true, { children: true });
    };
  }, [containerRef]);

  return appRef;
}
