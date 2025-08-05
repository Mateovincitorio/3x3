import React from 'react';
import './home.css';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className='navbar'>
      <ul>
        <li className='liNavbar'><Link to="/">Home</Link></li>
        <li className='liNavbar'><Link to="/cruces">Cruces</Link></li>
        <li className='liNavbar'><Link to="/equipos">Equipos</Link></li>
        <li className='liNavbar'>Contacto</li>
      </ul>
    </nav>
  );
};

export default Navbar;
