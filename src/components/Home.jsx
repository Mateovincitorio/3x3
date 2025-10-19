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
        <h1 className="torneo">3x3 tournament</h1>
        <div className="cards">
          <div className="card">
            <h2>Add Teams</h2>
            <p>Add the teams that will participate in the tournament.</p>
            <Link to="/crear" className="link">Go to Add Teams</Link>
        </div>
        <div className="card">
          <h2>Teams</h2>
          <p>View and manage the participating teams.</p>
          <Link to="/equipos" className="link">Go to Teams</Link>
        </div>
        </div>
      </div>
    </>
  );
};

export default Home;
