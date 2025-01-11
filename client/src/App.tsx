import { Routes, Route } from 'react-router-dom';
import HexMap from './components/HexMap';
import HexCalculator from './components/HexCalculator';
import { useRealms } from './hooks/useRealms';
import Pixi from './screens/Pixi';

function App() {
  const a = useRealms();
  console.log(a);
  return (
    <main className="h-screen bg-background">
      <Routes>
        <Route path="/" element={<HexMap />} />
        <Route path="/calculator" element={<HexCalculator />} />
        <Route path="/pixi" element={<Pixi />} />
      </Routes>
    </main>
  );
}

export default App;
