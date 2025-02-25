import React from 'react';
import { Card } from './ui/card';
import { Realm } from '../types';

interface RealmInfoCardProps {
  realm: Realm;
}

const RealmInfoCard: React.FC<RealmInfoCardProps> = ({ realm }) => {
  return (
    <Card className="fixed top-4 right-4 w-64 shadow-lg p-4 z-10">
      <h4 className="text-lg font-semibold mb-2">{realm.realmName}</h4>
      <p className="text-sm mb-2">
        Coordinates: ({realm.coordinates.x}, {realm.coordinates.y})
      </p>
      <div className="text-sm">
        <span className="font-medium">Resources:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {realm.resources.map((resourceId, index) => (
            <div
              key={`${resourceId}-${index}`}
              className="py-1 rounded-md flex items-center"
            >
              <div className="w-6 h-6 mr-1 relative">
                <img
                  src={`/assets/rcs/${resourceId}.png`}
                  alt={`Resource ${resourceId}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback in case the image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove(
                      'hidden'
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default RealmInfoCard;
