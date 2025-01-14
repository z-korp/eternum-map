import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Realm } from '../hooks/useRealms';

interface SearchMenuProps {
  realms: Realm[];
  onRealmSelect: (realm: Realm) => void;
  onPositionSelect: (position: { x: number; y: number }) => void;
}

const SearchMenu: React.FC<SearchMenuProps> = ({
  realms,
  onRealmSelect,
  onPositionSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [xCoord, setXCoord] = useState<string>('');
  const [yCoord, setYCoord] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const filteredRealms = realms
    .filter((realm) =>
      realm.realmName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
  };

  const handleRealmSelect = (realm: Realm): void => {
    onRealmSelect(realm);
    setSearchTerm(realm.realmName);
    setShowSearchResults(false);
  };

  const handlePositionSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const x = parseInt(xCoord);
    const y = parseInt(yCoord);
    if (!isNaN(x) && !isNaN(y)) {
      onPositionSelect({ x, y });
    }
  };

  const handleCoordChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ): void => {
    setter(e.target.value);
  };

  return (
    <Card className="fixed top-4 left-4 w-64 shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="relative">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search realms..."
              value={searchTerm}
              onChange={handleSearch}
              className="flex-1"
            />
          </div>

          {showSearchResults && filteredRealms.length > 0 && (
            <Card className="absolute w-full mt-1 z-50">
              <CardContent className="p-2">
                {filteredRealms.map((realm) => (
                  <Button
                    key={realm.realmName}
                    variant="ghost"
                    className="w-full justify-start text-left bg-white"
                    onClick={() => handleRealmSelect(realm)}
                  >
                    {realm.realmName}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <form onSubmit={handlePositionSubmit} className="space-y-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Input
                placeholder="X"
                value={xCoord}
                onChange={(e) => handleCoordChange(e, setXCoord)}
                type="number"
              />
              <Input
                placeholder="Y"
                value={yCoord}
                onChange={(e) => handleCoordChange(e, setYCoord)}
                type="number"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Go to Position
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchMenu;
