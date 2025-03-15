import React, { useState, useEffect, useMemo } from 'react';
import { useRealms } from '../hooks/useRealms';
import { Realm } from '../types';
import PixiRenderer from '../components/PixiRenderer';
import SearchMenu from '../components/SearchMenu';
import RealmInfoCard from '../components/RealmInfoCard';
import FilterPanel from '../components/FilterPanel';
import { useFiltersStore } from '../stores/useFiltersStore';

const HexGridScreen: React.FC = () => {
  // Core state
  const { realms } = useRealms();
  const [centerHex, setCenterHex] = useState({ col: -1, row: -26 });
  const [hoveredRealm, setHoveredRealm] = useState<Realm | null>(null);

  // Get filters from the store
  const { resources, alliance, player, showTiles } = useFiltersStore();

  // Filter realms based on selected filters
  const filteredRealms = useMemo(() => {
    console.log('resources', resources);
    // If no filters are active, show all realms
    if (resources.length === 0 && !alliance && !player) {
      return realms;
    }

    return realms.filter((realm) => {
      // Check resource filter
      const matchesResource =
        resources.length === 0 ||
        resources.some((r) => realm.resources.includes(r));

      console.log('realm', realm.resources, matchesResource);

      // Return true only if all active filters match
      return matchesResource;
    });
  }, [realms, resources, alliance, player]);

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
      {/* Add the FilterPanel */}
      <FilterPanel />

      <>
        {/* Realm info overlay */}
        {hoveredRealm && <RealmInfoCard realm={hoveredRealm} />}

        {/* Search and navigation UI */}
        <SearchMenu
          realms={filteredRealms}
          onRealmSelect={handleRealmSelect}
          onPositionSelect={handlePositionSelect}
        />

        {/* Pixi renderer with the hex grid */}
        <PixiRenderer
          centerHex={centerHex}
          realms={filteredRealms}
          onRealmHover={setHoveredRealm}
          showTiles={showTiles}
        />
      </>
    </div>
  );
};

export default HexGridScreen;
