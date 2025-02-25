import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import * as PIXI from 'pixi.js';
import { Grid } from 'honeycomb-grid';

export function useVisibleBounds(
  hexContainerRef: React.RefObject<PIXI.Container>,
  appRef: React.RefObject<PIXI.Application>,
  hexGridRef: React.RefObject<Grid<any>>
) {
  const [boundingBox, setBoundingBox] = useState({
    startCol: 0,
    endCol: 0,
    startRow: 0,
    endRow: 0,
  });

  const debouncedSetBoundingBox = useMemo(() => {
    return _.debounce((newBox) => {
      setBoundingBox(newBox);
    }, 50);
  }, [setBoundingBox]);

  const updateBoundingBox = useCallback(() => {
    if (!hexContainerRef.current || !appRef.current || !hexGridRef.current)
      return;

    const grid = hexGridRef.current;

    // Convert the screen corners to world coordinates
    const topLeft = hexContainerRef.current.toLocal({ x: 0, y: 0 });
    const bottomRight = hexContainerRef.current.toLocal({
      x: appRef.current.screen.width,
      y: appRef.current.screen.height,
    });
    const topRight = hexContainerRef.current.toLocal({
      x: appRef.current.screen.width,
      y: 0,
    });
    const bottomLeft = hexContainerRef.current.toLocal({
      x: 0,
      y: appRef.current.screen.height,
    });

    // Convert pixel coordinates to hex coordinates
    const topLeftHex = grid.pointToHex(topLeft, { allowOutside: false });
    const topRightHex = grid.pointToHex(topRight, { allowOutside: false });
    const bottomLeftHex = grid.pointToHex(bottomLeft, { allowOutside: false });
    const bottomRightHex = grid.pointToHex(bottomRight, {
      allowOutside: false,
    });

    const cols = [
      topLeftHex.col,
      topRightHex.col,
      bottomLeftHex.col,
      bottomRightHex.col,
    ];
    const rows = [
      topLeftHex.row,
      topRightHex.row,
      bottomLeftHex.row,
      bottomRightHex.row,
    ];

    const newBoundingBox = {
      startCol: Math.floor(Math.min(...cols)),
      endCol: Math.ceil(Math.max(...cols)),
      startRow: Math.floor(Math.min(...rows)),
      endRow: Math.ceil(Math.max(...rows)),
    };

    debouncedSetBoundingBox(newBoundingBox);
  }, [hexContainerRef, appRef, hexGridRef, debouncedSetBoundingBox]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetBoundingBox.cancel();
    };
  }, [debouncedSetBoundingBox]);

  return {
    boundingBox,
    updateBoundingBox,
  };
}
