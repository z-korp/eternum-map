// screens/HexGridScreen.tsx
import React, { useState, useEffect } from 'react';
import { useRealms } from '../hooks/useRealms';
import { useTilesStore } from '../stores/useTilesStore';
import { Realm } from '../types';

// Import existing components
import PixiRenderer from '../components/PixiRenderer';
import SearchMenu from '../components/SearchMenu';
import RealmInfoCard from '../components/RealmInfoCard';

const HexGridScreen: React.FC = () => {
  // Core state
  const { realms } = useRealms();
  const { tiles } = useTilesStore();
  const [centerHex, setCenterHex] = useState({ col: -1, row: -26 });
  const [hoveredRealm, setHoveredRealm] = useState<Realm | null>(null);

  // Handle realm selection
  const handleRealmSelect = (realm: Realm) => {
    console.log('Selected realm:', realm);
    setCenterHex({ col: realm.coordinates.x, row: realm.coordinates.y });
  };

  // Handle position selection (from search or elsewhere)
  const handlePositionSelect = (position: { x: number; y: number }) => {
    setCenterHex({ col: position.x, row: position.y });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setCenterHex((prev) => ({ ...prev, row: prev.row - 1 }));
          break;
        case 'ArrowDown':
          setCenterHex((prev) => ({ ...prev, row: prev.row + 1 }));
          break;
        case 'ArrowLeft':
          setCenterHex((prev) => ({ ...prev, col: prev.col - 1 }));
          break;
        case 'ArrowRight':
          setCenterHex((prev) => ({ ...prev, col: prev.col + 1 }));
          break;
        case 'Home':
          setCenterHex({ col: -1, row: -26 }); // Reset to default position
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-white">
      {/* Main Pixi Renderer - using only the props it actually accepts */}
      <PixiRenderer
        centerHex={centerHex}
        realms={realms}
        onRealmHover={setHoveredRealm}
      />

      {/* UI Overlays */}

      {/* Realm Info Card (when hovering) */}
      {hoveredRealm && <RealmInfoCard realm={hoveredRealm} />}

      {/* Search Menu - using only the props it actually accepts */}
      <SearchMenu
        realms={realms}
        onRealmSelect={handleRealmSelect}
        onPositionSelect={handlePositionSelect}
      />

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 py-1 px-4 text-sm text-gray-700 flex justify-between z-10">
        <div>
          Position: ({centerHex.col}, {centerHex.row})
        </div>
        <div>Tiles Loaded: {tiles.length}</div>
        <div>Realms: {realms.length}</div>
      </div>
    </div>
  );
};

export default HexGridScreen;
