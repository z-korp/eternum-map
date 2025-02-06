import { useTiles } from '../hooks/useTiles';
import { useTilesStore } from '../stores/useTilesStore';

export const Test = () => {
  useTiles({
    startCol: 2147483439, // 2147483639
    endCol: 2147483739,
    startRow: 2147483480, // 2147483639
    endRow: 2147483780,
    subscribe: true,
  });

  const { tiles } = useTilesStore();

  return (
    <div>
      <h2>Tile Map</h2>
      <ul>
        {tiles.map((tile) => (
          <li key={`${tile.col},${tile.row}`}>
            Col: {tile.col}, Row: {tile.row}
          </li>
        ))}
      </ul>
    </div>
  );
};
