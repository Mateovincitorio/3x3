import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebarseConfig"; // ojo al import

import Home from "./components/Home";
import CrearTorneo from "./components/CrearTorneo";
import Cruces from "./components/Cruces";
import Equipos from "./components/Equipos";
import AdminLogin from "./components/AdminLogin";

function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.role === "admin") {
          setAdmin(user);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ admin, children }) => {
    if (!admin) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  if (loading) return <p style={{ color: "white" }}>Cargando...</p>;

  return (
    <Routes>
      <Route path="/login" element={<AdminLogin onLogin={setAdmin} />} />
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
