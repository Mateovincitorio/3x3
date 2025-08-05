import { Routes, Route } from 'react-router-dom';
import Home from './components/home';
import CrearTorneo from './components/crearTorneo';
import Cruces from './components/Cruces';
import Equipos from './components/Equipos';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CrearTorneo />} />
        <Route path="/cruces" element={<Cruces />} />
        <Route path="/equipos" element={<Equipos />} />
      </Routes>
    </>
  );
}

export default App;
