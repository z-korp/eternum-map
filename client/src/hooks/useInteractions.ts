import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export function useInteractions(
  hexContainerRef: React.RefObject<PIXI.Container>,
  appRef: React.RefObject<PIXI.Application>,
  updateBoundingBox: () => void,
  updateHexesInView: () => void
) {
  const scaleFactor = useRef(1);

  useEffect(() => {
    if (!hexContainerRef.current || !appRef.current) return;

    const hexContainer = hexContainerRef.current;
    const app = appRef.current;

    // Setup pan/drag handling
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let containerStartPos = { x: 0, y: 0 };

    hexContainer.eventMode = 'static';
    hexContainer.cursor = 'grab';

    const onPointerDown = (e: PIXI.FederatedPointerEvent) => {
      isDragging = true;
      hexContainer.cursor = 'grabbing';
      dragStartPos = { x: e.global.x, y: e.global.y };
      containerStartPos = { x: hexContainer.x, y: hexContainer.y };
    };

    const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
      if (!isDragging) return;

      const dx = e.global.x - dragStartPos.x;
      const dy = e.global.y - dragStartPos.y;
      hexContainer.x = containerStartPos.x + dx;
      hexContainer.y = containerStartPos.y + dy;

      updateBoundingBox();
      updateHexesInView();
    };

    const endDrag = () => {
      isDragging = false;
      hexContainer.cursor = 'grab';
    };

    hexContainer.on('pointerdown', onPointerDown);
    hexContainer.on('pointermove', onPointerMove);
    hexContainer.on('pointerup', endDrag);
    hexContainer.on('pointerupoutside', endDrag);

    // Setup zoom handling
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const screenCenter = {
        x: app.screen.width / 2,
        y: app.screen.height / 2,
      };

      const worldPos = hexContainer.toLocal(screenCenter);

      scaleFactor.current *= e.deltaY < 0 ? 1.1 : 0.9;
      hexContainer.scale.set(scaleFactor.current);

      const newScreenPos = hexContainer.toGlobal(worldPos);
      const dx = screenCenter.x - newScreenPos.x;
      const dy = screenCenter.y - newScreenPos.y;
      hexContainer.x += dx;
      hexContainer.y += dy;

      updateBoundingBox();
      updateHexesInView();
    };

    app.canvas.addEventListener('wheel', handleWheel);

    return () => {
      hexContainer.off('pointerdown', onPointerDown);
      hexContainer.off('pointermove', onPointerMove);
      hexContainer.off('pointerup', endDrag);
      hexContainer.off('pointerupoutside', endDrag);
      app.canvas.removeEventListener('wheel', handleWheel);
    };
  }, [hexContainerRef, appRef, updateBoundingBox, updateHexesInView]);

  return {
    scaleFactor: scaleFactor.current,
  };
}
