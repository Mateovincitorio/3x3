import React from 'react'
import './home.css'
import Navbar from './Navbar'
import './crearTorneo.css'
import { db } from '../firebarseConfig.js'
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const CrearTorneo = () => {
  const [equipo, setEquipo] = useState({
    nombre: '',
    jugador1: '',
    jugador2: '',
    jugador3: '',
    jugador4: '',
  })

  const handleChange = (e) => {
    setEquipo({
      ...equipo,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "equipos"), equipo);
      console.log("Documento escrito con ID: ", docRef.id);
      setEquipo({
        nombre: '',
        jugador1: '',
        jugador2: '',
        jugador3: '',
        jugador4: ''
      });
      toast.success('Equipo creado correctamente', {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
  transition: Bounce,
  style: {
    backgroundColor: '#800080', // morado oscuro
    color: '#fff'
  }
});
    } catch (error) {
      console.error("Error añadiendo documento: ", error);
    }
    
  };


  return (
    <>
    <Navbar/>
    <div className="body">
    <div className="contenedor">
      <h1 className="añadirh1">Añadí los equipos a tu Torneo</h1>
    </div>
    <div className="formulario">
      <form action="" method="post" onSubmit={handleSubmit}>
        <input type="text" name="nombre" value={equipo.nombre} onChange={handleChange} placeholder="Nombre del equipo" required />
        <input type="text" name="jugador1" value={equipo.jugador1} onChange={handleChange} placeholder="Nombre del jugador 1" required />
        <input type="text" name="jugador2" value={equipo.jugador2} onChange={handleChange} placeholder="Nombre del jugador 2" required />
        <input type="text" name="jugador3" value={equipo.jugador3} onChange={handleChange} placeholder="Nombre del jugador 3" required />
        <input type="text" name="jugador4" value={equipo.jugador4} onChange={handleChange} placeholder="Nombre del jugador 4" required />
      <button className="crearEquipo" type="submit">Crear Equipo</button>
      </form>
    </div>
    </div>
    <ToastContainer />
    </>
  )
}

export default CrearTorneo