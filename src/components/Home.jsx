import React from "react";
import "./home.css";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";

const Home = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/crear");
  };
  return (
    <>
      <Navbar />
      <div className="home">
        <h1 className="torneo">Torneo 3x3</h1>
        <div className="cards">
          <div className="card">
            <h2>Agrega equipos</h2>
            <p>Agrega los equipos que participarán en el torneo.</p>
            <Link to="/crear" className="link">Ir a Agregar equipos</Link>
        </div>
        <div className="card">
          <h2>Equipos</h2>
          <p>Visualiza y gestiona los equipos participantes.</p>
          <Link to="/equipos" className="link">Ir a Equipos</Link>
        </div>
        </div>
      </div>
    </>
  );
};

export default Home;
