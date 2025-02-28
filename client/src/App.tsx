import { Routes, Route } from 'react-router-dom';
import HexCalculator from './components/HexCalculator';
import { useRealms } from './hooks/useRealms';
import HexGridScreen from './screens/HexGridScreen';

function App() {
  const a = useRealms();
  //const b = useTest();
  console.log('useRealms', a);
  //console.log(b);
  return (
    <main className="h-screen bg-background">
      <Routes>
        <Route path="/" element={<HexGridScreen />} />
        <Route path="/calculator" element={<HexCalculator />} />
      </Routes>
    </main>
  );
}

export default App;
