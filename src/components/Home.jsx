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
        <div className="texto">
          <h1>La forma mas practica de organizar un 3x3</h1>
          <button className="vertorneos" onClick={handleClick}>
            Ver torneo
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
