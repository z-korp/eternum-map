import React from 'react';
import { PlusIcon, MinusIcon, HomeIcon, SearchIcon } from 'lucide-react';
import { Button } from './ui/button';

interface HexGridControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSearch: () => void;
}

const HexGridControls: React.FC<HexGridControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onSearch,
}) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-10">
      <Button onClick={onZoomIn} size="icon" variant="secondary">
        <PlusIcon size={18} />
      </Button>
      <Button onClick={onZoomOut} size="icon" variant="secondary">
        <MinusIcon size={18} />
      </Button>
      <Button onClick={onReset} size="icon" variant="secondary">
        <HomeIcon size={18} />
      </Button>
      <Button onClick={onSearch} size="icon" variant="secondary">
        <SearchIcon size={18} />
      </Button>
    </div>
  );
};

export default HexGridControls;
