// components/HexGridContainer.tsx
import React, { useState } from 'react';
import SearchMenu from './SearchMenu';
import { useRealms } from '../hooks/useRealms';
import { Realm } from '../types';
import PixiRenderer from './PixiRenderer';
import RealmInfoCard from './RealmInfoCard';

const HexGridContainer: React.FC = () => {
  const { realms } = useRealms();
  const [centerHex, setCenterHex] = useState({ col: -1, row: -26 });
  const [hoveredRealm, setHoveredRealm] = useState<Realm | null>(null);

  const handleRealmHover = (realm: Realm | null) => {
    setHoveredRealm(realm);
  };

  const handleRealmSelect = (realm: Realm) => {
    console.log('Selected realm:', realm);
    setCenterHex({ col: realm.coordinates.x, row: realm.coordinates.y });
  };

  const handlePositionSelect = (position: { x: number; y: number }) => {
    setCenterHex({ col: position.x, row: position.y });
  };

  return (
    <div className="relative w-screen h-screen">
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
        onRealmHover={handleRealmHover}
      />
    </div>
  );
};

export default HexGridContainer;
