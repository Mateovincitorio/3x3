import React from 'react';
import './home.css';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className='navbar'>
      <ul>
        <li className='liNavbar'><Link className='Link' to="/">Home</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
