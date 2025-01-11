import { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { getResourceById } from '../types/resources';
import { getPlayerColors } from '../types/colors';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useRealms } from '../hooks/useRealms';

type Player = {
  id: number;
  name: string;
  guildId?: number;
};

type Realm = {
  id: number;
  name: string;
  playerId: number;
  position: { q: number; r: number };
  resources: number[];
};

type Troop = {
  id: number;
  number: number;
};

type Army = {
  id: number;
  playerId: number;
  position: { q: number; r: number };
  troops: Troop[];
};

type Mine = {
  id: number;
  playerId?: number;
  position: { q: number; r: number };
};

type HexTile = {
  q: number;
  r: number;
  discovered: boolean;
};

const HexMap = () => {
  const [mode, setMode] = useState<'Player' | 'Tribe'>('Player');
  const [hoveredCoords, setHoveredCoords] = useState<{
    q: number;
    r: number;
  } | null>(null);
  // View state for panning
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartView, setDragStartView] = useState({ x: 0, y: 0 });

  // Sample data - in a real app this would come from props or an API
  const [players] = useState<Player[]>([
    { id: 1, name: 'Player 1', guildId: 1 },
    { id: 2, name: 'Player 2', guildId: 1 },
    { id: 3, name: 'Player 3', guildId: 2 },
    { id: 4, name: 'Player 4', guildId: 2 },
  ]);

  const { realms: realms2 } = useRealms();

  const [realms] = useState<Realm[]>([
    {
      id: 1,
      name: 'Kingdom of the North',
      playerId: 1,
      position: { q: 0, r: 0 },
      resources: [1, 2, 3, 4, 5, 6],
    },
    {
      id: 2,
      name: 'Southern Empire',
      playerId: 2,
      position: { q: 1, r: -1 },
      resources: [4, 5],
    },
    {
      id: 3,
      name: 'Southern Empire',
      playerId: 3,
      position: { q: 5, r: -1 },
      resources: [4, 5],
    },
    {
      id: 4,
      name: 'Southern Empire',
      playerId: 4,
      position: { q: 4, r: 3 },
      resources: [4, 5],
    },
  ]);

  const [armies] = useState<Army[]>([
    {
      id: 1,
      playerId: 1,
      position: { q: 0, r: 0 },
      troops: [{ id: 255, number: 20000 }],
    },
    {
      id: 2,
      playerId: 3,
      position: { q: -1, r: 1 },
      troops: [{ id: 255, number: 20000 }],
    },
  ]);

  const [mines] = useState<Mine[]>([
    { id: 1, position: { q: 2, r: -2 }, playerId: 1 },
    { id: 2, position: { q: -2, r: 2 }, playerId: undefined },
  ]);

  // Increased map size
  const [hexGrid] = useState<HexTile[]>(() => {
    const grid: HexTile[] = [];
    const size = 300; // Increased radius of the hex grid
    for (let q = -size; q <= size; q++) {
      for (let r = -size; r <= size; r++) {
        if (Math.abs(q + r) <= size) {
          grid.push({ q, r, discovered: Math.random() > 0.3 });
        }
      }
    }
    return grid;
  });

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartView({ x: viewPosition.x, y: viewPosition.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      // Throttle updates with requestAnimationFrame
      requestAnimationFrame(() => {
        setViewPosition({
          x: dragStartView.x + dx,
          y: dragStartView.y + dy,
        });
      });
    },
    [isDragging, dragStart.x, dragStart.y, dragStartView.x, dragStartView.y]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leaving the SVG area
  useEffect(() => {
    const handleMouseLeave = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Filters state remains the same...
  const [filters, setFilters] = useState({
    showRealms: true,
    showArmies: true,
    showMines: true,
    selectedGuild: null as number | null,
  });

  // Helper functions remain the same...
  const getPlayerName = (playerId: number) => {
    return players.find((p) => p.id === playerId)?.name || 'Unknown Player';
  };

  console.log(realms2);

  // Filtering logic remains the same...
  const filteredRealms = realms.filter(() => filters.showRealms);
  /*.filter((realm) => {
      if (!filters.selectedGuild) return true;
      const player = players.find((p) => p.id === realm.playerId);
      return player?.guildId === filters.selectedGuild;
    });*/

  const filteredArmies = armies
    .filter(() => filters.showArmies)
    .filter((army) => {
      if (!filters.selectedGuild) return true;
      const player = players.find((p) => p.id === army.playerId);
      return player?.guildId === filters.selectedGuild;
    });

  const filteredMines = mines.filter(() => filters.showMines);

  const isHexVisible = (x: number, y: number) => {
    // Add this function
    const buffer = 100; // pixels
    return (
      x > -800 - buffer &&
      x < 800 + buffer &&
      y > -600 - buffer &&
      y < 600 + buffer
    );
  };

  const hexToPixel = useCallback((q: number, r: number) => {
    const size = 40; // Adjust hex size if necessary
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);

    // Adjust to the center of the SVG
    const offsetX = 400; // Center X offset (adjust based on SVG size)
    const offsetY = 400; // Center Y offset
    return { x: x + offsetX, y: y + offsetY };
  }, []);

  const getHexPoints = useCallback((x: number, y: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = ((60 * i - 30) * Math.PI) / 180;
      return `${x + 37 * Math.cos(angle)},${y + 37 * Math.sin(angle)}`;
    }).join(' ');
  }, []);

  const hexVisible = (finalX: number, finalY: number) => {
    const buffer = 200; // add some padding so tiles near edge render
    return (
      finalX >= -buffer &&
      finalX <= viewportSize.width + buffer &&
      finalY >= -buffer &&
      finalY <= viewportSize.height + buffer
    );
  };

  return (
    <TooltipProvider>
      <div className="h-full w-full overflow-hidden">
        {hoveredCoords && (
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 px-2 py-1">
            <span className="font-mono">
              ({hoveredCoords.q}, {hoveredCoords.r})
            </span>
          </div>
        )}

        {/* Filters section remains the same... */}
        <div className="mb-4 space-x-4 flex p-4">
          <button
            className={`px-3 py-2 rounded ${
              filters.showRealms ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() =>
              setFilters((f) => ({ ...f, showRealms: !f.showRealms }))
            }
          >
            Realms
          </button>
          <button
            className={`px-3 py-2 rounded ${
              filters.showArmies ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() =>
              setFilters((f) => ({ ...f, showArmies: !f.showArmies }))
            }
          >
            Armies
          </button>
          <button
            className={`px-3 py-2 rounded ${
              filters.showMines ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() =>
              setFilters((f) => ({ ...f, showMines: !f.showMines }))
            }
          >
            Mines
          </button>
          <Select
            value={filters.selectedGuild ? String(filters.selectedGuild) : ''}
            onValueChange={(value) =>
              setFilters((f) => ({
                ...f,
                selectedGuild: value ? Number(value) : null,
              }))
            }
          >
            <SelectTrigger className="px-3 py-2 rounded border w-[180px] h-full">
              <SelectValue placeholder="All Guilds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Guilds</SelectItem>
              <SelectItem value="1">Guild 1</SelectItem>
              <SelectItem value="2">Guild 2</SelectItem>
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => setMode(value as 'Player' | 'Tribe')}
            className="flex"
          >
            <ToggleGroupItem
              value="Player"
              className={`px-4 py-2 rounded-l-lg ${
                mode === 'Player'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              Player
            </ToggleGroupItem>
            <ToggleGroupItem
              value="Tribe"
              className={`px-4 py-2 rounded-r-lg ${
                mode === 'Tribe'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              Tribe
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Hex Grid with panning */}
        <div className="h-full w-full border rounded overflow-hidden">
          <svg
            className={`w-full h-full cursor-${
              isDragging ? 'grabbing' : 'grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <g transform={`translate(${viewPosition.x}, ${viewPosition.y})`}>
              {hexGrid.map((hex) => {
                const { x, y } = hexToPixel(hex.q, hex.r);
                const points = getHexPoints(x, y);

                return (
                  <g key={`hex-${hex.q}-${hex.r}`}>
                    <polygon
                      points={points}
                      fill={hex.discovered ? '#f0f0f0' : '#d0d0d0'}
                      stroke="#999"
                      strokeWidth="1"
                      onMouseEnter={() =>
                        setHoveredCoords({ q: hex.q, r: hex.r })
                      }
                      onMouseLeave={() => setHoveredCoords(null)}
                    />
                  </g>
                );
              })}
              {filteredRealms.map((realm) => {
                if (!realm.position) return null;
                const { x, y } = hexToPixel(realm.position.q, realm.position.r);
                const points = getHexPoints(x, y);

                /*const id =
                mode === 'Player'
                  ? realm.id
                  : players[realm.playerId - 1].guildId;*/
                const colors = getPlayerColors(0);

                return (
                  <Tooltip key={`realm-${realm.id}`}>
                    <TooltipTrigger asChild>
                      <g>
                        <polygon
                          points={points}
                          fill={colors ? colors.background : '#ffff'}
                          stroke={colors ? colors.border : '#999'}
                          strokeWidth="3"
                        />
                        {/* Render the Castle icon */}
                        {/*<Castle
                          x={x - 10} // Adjust the x position for centering
                          y={y - 10} // Adjust the y position for centering
                          width={20} // Size of the castle icon
                          height={20} // Size of the castle icon
                          className="text-gray-800" // Optional: Tailwind CSS class for color
                        />*/}
                        {realm.resources.map((resourceId, index) => {
                          const resource = getResourceById(resourceId);
                          if (!resource) return null;

                          const angle =
                            (index * 2 * Math.PI) / realm.resources.length;
                          const radius = 20;
                          const resourceX = x + radius * Math.cos(angle);
                          const resourceY = y + radius * Math.sin(angle);

                          return (
                            <image
                              key={`resource-${resourceId}`}
                              href={resource.imagePath}
                              x={resourceX - 10}
                              y={resourceY - 10}
                              width={20}
                              height={20}
                              className="pointer-events-none"
                            />
                          );
                        })}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Realm: {realm.realmName}</p>
                      <p>Ruler: {getPlayerName(1)}</p>
                      <p>
                        Resources:{' '}
                        {realm.resources
                          .map((id) => getResourceById(id)?.name)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p>
                        Location: ({realm.position.q}, {realm.position.r})
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {filteredArmies.map((army) => {
                const { x, y } = hexToPixel(army.position.q, army.position.r);
                return (
                  <Tooltip key={`army-${army.id}`}>
                    <TooltipTrigger asChild>
                      <g>
                        <Shield
                          className="text-blue-500"
                          x={x - 12}
                          y={y - 12}
                        />
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        <strong>Army of:</strong> {getPlayerName(army.playerId)}
                      </p>
                      <p>
                        <strong>Location:</strong> ({army.position.q},{' '}
                        {army.position.r})
                      </p>
                      <p>
                        <strong>Troops:</strong>
                      </p>
                      <ul className="mt-2 space-y-2">
                        {army.troops.map((troop) => {
                          const troopDetails = getResourceById(troop.id); // Assuming `getResourceById` returns troop details
                          if (!troopDetails) return null;

                          return (
                            <li key={troop.id} className="flex items-center">
                              {/* Troop image */}
                              <img
                                src={troopDetails.imagePath} // Path to the troop image
                                alt={troopDetails.name}
                                className="w-8 h-8 mr-2 rounded"
                              />
                              {/* Troop name and count */}
                              <span>
                                {troopDetails.name} -{' '}
                                <strong>{troop.number}</strong>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {filteredMines.map((mine) => {
                const { x, y } = hexToPixel(mine.position.q, mine.position.r);

                // Fetch the resource details for ID 29
                const resource = getResourceById(29);
                const colors = getPlayerColors(mine.playerId || 0);

                return (
                  <Tooltip key={`mine-${mine.id}`}>
                    <TooltipTrigger asChild>
                      <g>
                        {/* Render the hexagon for the mine */}
                        <polygon
                          points={getHexPoints(x, y)}
                          fill={mine.playerId ? colors.background : '#ffff'}
                          stroke={mine.playerId ? colors.border : '#999'}
                          strokeWidth={mine.playerId ? 3 : 1}
                        />
                        {/* Render the pickaxe icon */}
                        {/*<Pickaxe
                          className="text-yellow-500"
                          x={x - 10}
                          y={y - 10}
                          width={20}
                          height={20}
                        />*/}
                        {/* Render the image for resource ID 29 */}
                        {resource && (
                          <image
                            href={resource.imagePath}
                            x={x - 10} // Adjust position for centering
                            y={y - 10} // Position above the mine
                            width={20} // Size of the image
                            height={20} // Size of the image
                            className="pointer-events-none"
                          />
                        )}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mine</p>
                      <p>
                        Location: ({mine.position.q}, {mine.position.r})
                      </p>
                      {/* Display resource details in the tooltip */}
                      {resource && <p>Resource: {resource.name}</p>}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default HexMap;
