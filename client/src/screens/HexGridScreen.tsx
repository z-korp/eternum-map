import React, { useState, useEffect } from 'react';
import { useRealms } from '../hooks/useRealms';
import { Realm } from '../types';
import PixiRenderer from '../components/PixiRenderer';
import SearchMenu from '../components/SearchMenu';
import RealmInfoCard from '../components/RealmInfoCard';

const HexGridScreen: React.FC = () => {
  // Core state
  const { realms } = useRealms();
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
    <div className="relative w-screen h-screen">
      <>
        {/* Realm info overlay */}
        {hoveredRealm && <RealmInfoCard realm={hoveredRealm} />}

        {/* Search and navigation UI */}
        <SearchMenu
          realms={realms}
          onRealmSelect={handleRealmSelect}
          onPositionSelect={handlePositionSelect}
        />

        {/* Pixi renderer with the hex grid */}
        <PixiRenderer
          centerHex={centerHex}
          realms={realms}
          onRealmHover={setHoveredRealm}
        />
      </>
    </div>
  );
};

export default HexGridScreen;
