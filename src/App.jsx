import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import CrearTorneo from "./components/CrearTorneo";
import Cruces from "./components/Cruces";
import Equipos from "./components/Equipos";
import AdminLogin from "./components/AdminLogin"; // <-- Crear este componente

function App() {
  const [admin, setAdmin] = useState(null); // Estado para guardar al admin logueado

  const ProtectedRoute = ({ admin, children }) => {
    if (!admin) {
      return <Navigate to="/login" />; // Redirige si no hay admin
    }
    return children;
  };

  return (
    <Routes>
      {/* Ruta pública para login */}
      <Route path="/login" element={<AdminLogin onLogin={setAdmin} />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute admin={admin}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crear"
        element={
          <ProtectedRoute admin={admin}>
            <CrearTorneo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cruces"
        element={
          <ProtectedRoute admin={admin}>
            <Cruces />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipos"
        element={
          <ProtectedRoute admin={admin}>
            <Equipos />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
