import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Realm } from '../types';

interface MiniMapProps {
  realms: Realm[];
  currentViewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onPositionSelect: (position: { x: number; y: number }) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({
  realms,
  currentViewport,
  onPositionSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    appRef.current = app;

    const initMiniMap = async () => {
      await app.init({
        background: 0xf0f0f0,
        width: 200,
        height: 200,
        antialias: true,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      // Create container for the minimap
      const mapContainer = new PIXI.Container();
      app.stage.addChild(mapContainer);

      // Add realms as dots
      realms.forEach((realm) => {
        const dot = new PIXI.Graphics();
        dot.beginFill(0x006699);
        dot.drawCircle(0, 0, 2);
        dot.endFill();

        // Scale and position the dot
        const scale = 0.1; // Adjust based on your world size
        dot.position.set(
          realm.coordinates.x * scale + 100, // Center in the minimap
          realm.coordinates.y * scale + 100
        );

        mapContainer.addChild(dot);
      });

      // Add viewport rectangle
      const viewport = new PIXI.Graphics();
      viewport.lineStyle(1, 0xff0000);
      viewport.drawRect(
        currentViewport.x,
        currentViewport.y,
        currentViewport.width,
        currentViewport.height
      );
      mapContainer.addChild(viewport);

      // Make the minimap interactive
      app.canvas.addEventListener('click', (e) => {
        const rect = app.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert minimap coordinates to world coordinates
        const worldX = (x - 100) / 0.1;
        const worldY = (y - 100) / 0.1;

        onPositionSelect({ x: Math.round(worldX), y: Math.round(worldY) });
      });
    };

    initMiniMap();

    return () => {
      app.destroy(true, { children: true });
    };
  }, [realms, currentViewport, onPositionSelect]);

  // Update viewport rectangle when currentViewport changes
  useEffect(() => {
    if (!appRef.current) return;

    const mapContainer = appRef.current.stage.getChildAt(0) as PIXI.Container;
    const viewport = mapContainer.getChildAt(
      mapContainer.children.length - 1
    ) as PIXI.Graphics;

    viewport.clear();
    viewport.lineStyle(1, 0xff0000);
    viewport.drawRect(
      currentViewport.x,
      currentViewport.y,
      currentViewport.width,
      currentViewport.height
    );
  }, [currentViewport]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-6 rounded-md shadow-md overflow-hidden border border-gray-300 z-10"
    />
  );
};

export default MiniMap;
