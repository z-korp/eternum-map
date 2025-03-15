import React, { useState, useEffect } from 'react';
import { Filter, X, Info, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useFiltersStore } from '../stores/useFiltersStore';
import { useRealms } from '../hooks/useRealms';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const FilterPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    resources,
    alliance,
    player,
    showTiles,
    setResourceFilters,
    setAllianceFilter,
    setPlayerFilter,
    setShowTiles,
    clearFilters,
  } = useFiltersStore();

  const { realms } = useRealms();

  useEffect(() => {
    console.log('realms', realms);
  }, [realms]);

  // Extract unique resources, alliances, and players from realms
  const [availableResources, setAvailableResources] = useState<number[]>([]);
  const [availableAlliances, setAvailableAlliances] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);

  // Update available options when realms change
  useEffect(() => {
    const resourceSet = new Set<number>();
    const allianceSet = new Set<string>();
    const playerSet = new Set<string>();

    // Extract data from realms
    realms.forEach((realm) => {
      // Add resources
      if (realm.resources && Array.isArray(realm.resources)) {
        realm.resources.forEach((resource) => resourceSet.add(resource));
      }
    });

    setAvailableResources(Array.from(resourceSet).sort());
    setAvailableAlliances(Array.from(allianceSet).sort());
    setAvailablePlayers(Array.from(playerSet).sort());

    // Re-apply filters when realms change
    const { applyCurrentFilters } = useFiltersStore.getState();
    applyCurrentFilters();
  }, [realms]);

  // Handle resource selection
  const handleResourceToggle = (resource: number) => {
    if (resources.includes(resource)) {
      setResourceFilters(resources.filter((r) => r !== resource));
    } else {
      setResourceFilters([...resources, resource]);
    }
  };

  // Calculate active filter count for the badge
  const activeFilterCount =
    resources.length + (alliance ? 1 : 0) + (player ? 1 : 0);

  // Check if any filter data is available
  const hasAnyFilterData =
    availableResources.length > 0 ||
    availableAlliances.length > 0 ||
    availablePlayers.length > 0;

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        className="bg-white rounded-lg shadow-lg h-full border border-gray-200"
        initial={false}
        animate={{
          width: isOpen ? 300 : 42,
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
              className="w-6 h-6 cursor-pointer flex items-center justify-center relative"
              onClick={() => setIsOpen(true)}
            >
              <Filter className="w-6 h-6 text-gray-700" />
              {activeFilterCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  variant="destructive"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          ) : (
            <motion.div
              className="space-y-4 h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Filters</h3>
                <X
                  className="w-4 h-4 text-gray-700 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                />
              </div>

              {!hasAnyFilterData ? (
                <div className="p-4 flex flex-col items-center space-y-2 text-center border rounded-md border-gray-200 bg-gray-50">
                  <Info className="w-10 h-10 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    No filter data available yet. Explore the map to discover
                    resources, alliances, and players.
                  </p>
                </div>
              ) : (
                <>
                  {/* Add Map Tiles Toggle Section */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-700" />
                        <h4 className="font-medium text-sm">Show Map Tiles</h4>
                      </div>
                      <Switch
                        checked={showTiles}
                        onCheckedChange={setShowTiles}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Toggle to show or hide the map tiles on the grid
                    </p>
                  </div>
                  {/* Resource Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Resources</h4>
                      {availableResources.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs">
                                {availableResources.length}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Available resources</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {availableResources.length > 0 ? (
                      <ScrollArea className="h-26 border rounded-md p-2">
                        <div className="p-2 flex flex-wrap gap-2">
                          {availableResources.map((resource) => (
                            <div
                              key={resource}
                              className="cursor-pointer"
                              onClick={() => handleResourceToggle(resource)}
                            >
                              <div
                                className={`p-0.5 transition-all duration-200 ${
                                  resources.includes(resource)
                                    ? 'bg-blue-100 ring-2 ring-blue-500 rounded-full'
                                    : 'hover:bg-gray-100 rounded-md'
                                }`}
                              >
                                <img
                                  src={`/assets/rcs/${resource}.png`}
                                  alt={`Resource ${resource}`}
                                  className="w-6 h-6"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="h-10 flex items-center justify-center border rounded-md text-gray-500 text-sm bg-gray-50">
                        No resources discovered yet
                      </div>
                    )}
                  </div>

                  {/* Alliance Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Alliance</h4>
                      {availableAlliances.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs">
                                {availableAlliances.length}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Available alliances</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {availableAlliances.length > 0 ? (
                      <Select
                        value={alliance || ''}
                        onValueChange={(value) =>
                          setAllianceFilter(value || null)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Alliances" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Alliances</SelectItem>
                          {availableAlliances.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-10 flex items-center justify-center border rounded-md text-gray-500 text-sm bg-gray-50">
                        No alliances discovered yet
                      </div>
                    )}
                  </div>

                  {/* Player Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Player</h4>
                      {availablePlayers.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs">
                                {availablePlayers.length}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Available players</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {availablePlayers.length > 0 ? (
                      <Select
                        value={player || ''}
                        onValueChange={(value) =>
                          setPlayerFilter(value || null)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Players" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Players</SelectItem>
                          {availablePlayers.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-10 flex items-center justify-center border rounded-md text-gray-500 text-sm bg-gray-50">
                        No players discovered yet
                      </div>
                    )}
                  </div>
                </>
              )}

              {hasAnyFilterData && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                  disabled={activeFilterCount === 0}
                >
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FilterPanel;
