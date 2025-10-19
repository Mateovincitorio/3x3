// src/components/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebarseConfig.js";
import './crearTorneo.css';
import './home.css';
import './cruces.css'
import './adminlogin.css'

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const tokenResult = await user.getIdTokenResult();
      if (tokenResult.claims.role === "admin") {
        onLogin(user);
        navigate("/");
      } else {
        setError("No tienes permisos de administrador.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="contenedor-login">
      <h2 className="login-title">Login Admin</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="boton">
          Log in
        </button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  );
}