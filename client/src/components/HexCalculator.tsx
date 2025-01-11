import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface Coordinate {
  q: number;
  r: number;
}

const HexCalculator = () => {
  const [start, setStart] = useState<Coordinate>({ q: 0, r: 0 });
  const [end, setEnd] = useState<Coordinate>({ q: 0, r: 0 });
  const [distance, setDistance] = useState<number | null>(null);
  const [path, setPath] = useState<Coordinate[]>([]);

  // Calculate the hex distance between two points
  const calculateHexDistance = (start: Coordinate, end: Coordinate) => {
    // In a hex grid, we need to consider the third coordinate 's'
    // s = -q - r
    const startS = -start.q - start.r;
    const endS = -end.q - end.r;

    // The distance is the maximum absolute difference among the three coordinates
    return Math.max(
      Math.abs(start.q - end.q),
      Math.abs(start.r - end.r),
      Math.abs(startS - endS)
    );
  };

  // Calculate path between two points (simple linear interpolation)
  const calculatePath = (start: Coordinate, end: Coordinate) => {
    const distance = calculateHexDistance(start, end);
    const path: Coordinate[] = [];

    for (let i = 0; i <= distance; i++) {
      const t = distance === 0 ? 0 : i / distance;
      const q = Math.round(start.q + (end.q - start.q) * t);
      const r = Math.round(start.r + (end.r - start.r) * t);
      path.push({ q, r });
    }

    return path;
  };

  const handleCalculate = () => {
    const dist = calculateHexDistance(start, end);
    setDistance(dist);
    setPath(calculatePath(start, end));
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hex Grid Distance Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Start Coordinate</h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="q"
                  value={start.q}
                  onChange={(e) =>
                    setStart({ ...start, q: parseInt(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  placeholder="r"
                  value={start.r}
                  onChange={(e) =>
                    setStart({ ...start, r: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">End Coordinate</h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="q"
                  value={end.q}
                  onChange={(e) =>
                    setEnd({ ...end, q: parseInt(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  placeholder="r"
                  value={end.r}
                  onChange={(e) =>
                    setEnd({ ...end, r: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full mb-4">
            Calculate Distance
          </Button>

          {distance !== null && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Results:</p>
                  <p>Distance: {distance} tiles</p>
                  <p>Path coordinates:</p>
                  <div className="bg-secondary p-2 rounded">
                    {path.map((coord, index) => (
                      <div key={index} className="font-mono">
                        {index + 1}. ({coord.q}, {coord.r})
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HexCalculator;
