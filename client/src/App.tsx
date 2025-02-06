import { Routes, Route } from 'react-router-dom';
import HexCalculator from './components/HexCalculator';
import { useRealms } from './hooks/useRealms';
import Pixi from './screens/Pixi';
import { Test } from './screens/Test';

function App() {
  const a = useRealms();
  //const b = useTest();
  console.log(a);
  //console.log(b);
  return (
    <main className="h-screen bg-background">
      <Routes>
        <Route path="/" element={<Pixi />} />
        <Route path="/calculator" element={<HexCalculator />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </main>
  );
}

export default App;
