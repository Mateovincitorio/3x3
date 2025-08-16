import React, { useState } from 'react';
import './home.css';
import Navbar from './Navbar';
import './crearTorneo.css';
import { db } from '../firebarseConfig.js';
import { collection, addDoc } from 'firebase/firestore';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CrearTorneo = () => {
  const [equipo, setEquipo] = useState({
    nombre: '',
    jugador1: '',
    jugador2: '',
    jugador3: '',
    jugador4: '',
    categoria: '',
    zona: ''
  });

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    setEquipo({
      ...equipo,
      [e.target.name]: e.target.value
    });
  };

  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Guardar el equipo completo
      const docRef = await addDoc(collection(db, "equipos"), equipo);
      console.log("Equipo creado con ID: ", docRef.id);

      // 2. Guardar jugadores individuales en la colección "jugadores"
      const jugadoresArray = [
        equipo.jugador1,
        equipo.jugador2,
        equipo.jugador3,
        equipo.jugador4
      ];

      for (let jugador of jugadoresArray) {
        if (jugador.trim() !== "") {
          await addDoc(collection(db, "jugadores"), {
            nombre: jugador,
            equipoId: docRef.id,   // Relación con el equipo
            categoria: equipo.categoria
          });
        }
      }

      // 3. Resetear formulario
      setEquipo({
        nombre: '',
        jugador1: '',
        jugador2: '',
        jugador3: '',
        jugador4: '',
        categoria: '',
        zona: ''
      });

      // 4. Notificación
      toast.success('Equipo y jugadores creados correctamente', {
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
          backgroundColor: '#800080',
          color: '#fff'
        }
      });
    } catch (error) {
      console.error("Error añadiendo documento: ", error);
      toast.error('Ocurrió un error al crear el equipo', {
        position: "top-right",
        autoClose: 5000,
        theme: "colored"
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="body">
        <div className="contenedor">
          <h1 className="añadirh1">Añadí los equipos a tu Torneo</h1>
        </div>
        <div className="formulario">
          <form onSubmit={handleSubmit}>
            <input type="text" name="nombre" value={equipo.nombre} onChange={handleChange} placeholder="Nombre del equipo" required />
            <input type="text" name="jugador1" value={equipo.jugador1} onChange={handleChange} placeholder="Nombre del jugador 1" required />
            <input type="text" name="jugador2" value={equipo.jugador2} onChange={handleChange} placeholder="Nombre del jugador 2" required />
            <input type="text" name="jugador3" value={equipo.jugador3} onChange={handleChange} placeholder="Nombre del jugador 3" required />
            <input type="text" name="jugador4" value={equipo.jugador4} onChange={handleChange} placeholder="Nombre del jugador 4" required />
            <input type="text" name="categoria" value={equipo.categoria} onChange={handleChange} placeholder="Categoría" required />
            <input type='text' name='zona' value={equipo.zona} onChange={handleChange} placeholder='Zona' required />
            <button className="crearEquipo" type="submit">Crear Equipo</button>
            <button className="crearEquipo" type="button" onClick={() => window.location.href = '/'}>Volver a Home</button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default CrearTorneo;
