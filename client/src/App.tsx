import { Routes, Route } from 'react-router-dom';
import HexCalculator from './components/HexCalculator';
import { useRealms } from './hooks/useRealms';
import Pixi from './screens/Pixi';

function App() {
  const a = useRealms();
  console.log(a);
  return (
    <main className="h-screen bg-background">
      <Routes>
        <Route path="/" element={<Pixi />} />
        <Route path="/calculator" element={<HexCalculator />} />
      </Routes>
    </main>
  );
}

export default App;
