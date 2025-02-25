import { useEffect, useMemo, useRef } from 'react';
import { defineHex, Orientation, Grid } from 'honeycomb-grid';

export function useHexGrid(HEX_SIZE = 30) {
  // Define hex grid
  const myHex = useMemo(
    () =>
      defineHex({
        dimensions: HEX_SIZE,
        orientation: Orientation.POINTY,
        offset: -1,
      }),
    [HEX_SIZE]
  );

  const hexGridRef = useRef<Grid<any> | null>(null);

  // Initialize grid once
  useEffect(() => {
    if (!hexGridRef.current) {
      function bigNegativeToPositiveShape() {
        const coords = [];
        for (let col = -1000; col <= 1000; col++) {
          for (let row = -1000; row <= 1000; row++) {
            coords.push({ col, row });
          }
        }
        return coords;
      }

      hexGridRef.current = new Grid(myHex, bigNegativeToPositiveShape());
    }
  }, [myHex]);

  return {
    grid: hexGridRef.current,
    hex: myHex,
    HEX_SIZE,
  };
}
