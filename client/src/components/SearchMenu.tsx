import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [xCoord, setXCoord] = useState('');
  const [yCoord, setYCoord] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredRealms = realms
    .filter((realm) =>
      realm.realmName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5);

  const handleRealmSelect = (realm: Realm) => {
    onRealmSelect(realm);
    setSearchTerm(realm.realmName);
    setShowSearchResults(false);
    if (realm.coordinates) {
      const { x, y } = realm.coordinates;
      setXCoord(x.toString());
      setYCoord(y.toString());
      onPositionSelect({ x, y });
    }
  };

  const handlePositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseInt(xCoord);
    const y = parseInt(yCoord);
    if (!isNaN(x) && !isNaN(y)) {
      onPositionSelect({ x, y });
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <motion.div
        className="bg-white rounded-lg shadow-lg h-full border border-gray-200"
        initial={false}
        animate={{
          width: isOpen ? 256 : 42,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <div className="p-2 h-full">
          {!isOpen ? (
            <div
              className="w-6 h-6 cursor-pointer flex items-center justify-center"
              onClick={() => setIsOpen(true)}
            >
              <Search className="w-6 h-6 text-gray-700" />
            </div>
          ) : (
            <motion.div
              className="space-y-4 h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-end">
                <X
                  className="w-4 h-4 text-gray-700 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                />
              </div>

              <div className="relative">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search realms..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSearchResults(e.target.value.length > 0);
                    }}
                    className="flex-1"
                  />
                </div>

                <AnimatePresence>
                  {showSearchResults && filteredRealms.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute w-full mt-1 bg-white shadow-lg max-h-60 overflow-auto rounded-md"
                    >
                      {filteredRealms.map((realm) => (
                        <Button
                          key={realm.realmName}
                          variant="ghost"
                          className="w-full justify-start text-left hover:bg-gray-100 bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                          onClick={() => handleRealmSelect(realm)}
                        >
                          {realm.realmName}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <form onSubmit={handlePositionSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <Input
                      placeholder="X"
                      value={xCoord}
                      onChange={(e) => {
                        setXCoord(e.target.value);
                        setSearchTerm('');
                      }}
                      type="number"
                    />
                    <Input
                      placeholder="Y"
                      value={yCoord}
                      onChange={(e) => {
                        setYCoord(e.target.value);
                        setSearchTerm('');
                      }}
                      type="number"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Go to Position
                </Button>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SearchMenu;
