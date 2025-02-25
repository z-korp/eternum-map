import React, { useState } from 'react';
import { Realm } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { ListIcon } from 'lucide-react';

interface RealmListProps {
  realms: Realm[];
  onRealmSelect: (realm: Realm) => void;
}

const RealmList: React.FC<RealmListProps> = ({ realms, onRealmSelect }) => {
  const [filter, setFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredRealms = realms.filter((realm) =>
    realm.realmName.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (realm: Realm) => {
    onRealmSelect(realm);
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-10"
        >
          <ListIcon size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Realms</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Filter realms..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRealms.map((realm) => (
                  <TableRow key={realm.realmId}>
                    <TableCell>{realm.realmName}</TableCell>
                    <TableCell>
                      ({realm.coordinates.x}, {realm.coordinates.y})
                    </TableCell>
                    <TableCell>
                      {realm.resources.slice(0, 3).join(', ')}
                      {realm.resources.length > 3 &&
                        ` +${realm.resources.length - 3} more`}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelect(realm)}
                      >
                        Go
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealmList;
