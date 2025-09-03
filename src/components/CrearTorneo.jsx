import React, { useState } from 'react';
import './home.css';
import Navbar from './Navbar';
import './crearTorneo.css';
import { db } from '../firebarseConfig.js';
import { collection, addDoc, doc, setDoc, where } from 'firebase/firestore';

import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CrearTorneo = () => {
  const [equipo, setEquipo] = useState({
    nombre: '',
    jugador1: '',
    jugador2: '',
    jugador3: '',
    jugador4: '',
    categoria: ''
  });

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEquipo({
      ...equipo,
      [name]: value
    });
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    console.log("Equipo a guardar:", equipo);

    // Crear equipo en la colección principal
    const docRef = await addDoc(collection(db, "equipos"), equipo);
    console.log("Equipo creado con ID: ", docRef.id);

    // Crear el equipo dentro de la subcolección de la categoría
    console.log("Guardando en categoria:", equipo.categoria);
    await setDoc(
      doc(db, "categorias", equipo.categoria, "equipos", docRef.id),
      { ...equipo, id: docRef.id }
    );
    console.log("Equipo guardado en categoria");

    // Crear jugadores
    const jugadoresArray = [
      equipo.jugador1,
      equipo.jugador2,
      equipo.jugador3,
      equipo.jugador4
    ];

    for (let jugador of jugadoresArray) {
      if (jugador.trim() !== "") {
        console.log("Creando jugador:", jugador);
        await addDoc(collection(db, "jugadores"), {
          nombre: jugador,
          equipoId: docRef.id,
          categoria: equipo.categoria
        });
      }
    }
    console.log("Jugadores creados");

    // Reset form
    setEquipo({
      nombre: '',
      jugador1: '',
      jugador2: '',
      jugador3: '',
      jugador4: '',
      categoria: ''
    });

    toast.success('Equipo y jugadores creados correctamente', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
      transition: Bounce,
      style: {
        backgroundColor: '#800080',
        color: '#fff'
      }
    });
  } catch (error) {
    console.error("🔥 Error en handleSubmit:", error);
    toast.error('Ocurrió un error al crear el equipo', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
      transition: Bounce,
      style: {
        backgroundColor: '#800080',
        color: '#fff'
      }
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
            <input
              type="text"
              name="nombre"
              value={equipo.nombre}
              onChange={handleChange}
              placeholder="Nombre del equipo"
              required
            />
            <input
              type="text"
              name="jugador1"
              value={equipo.jugador1}
              onChange={handleChange}
              placeholder="Nombre del jugador 1"
              required
            />
            <input
              type="text"
              name="jugador2"
              value={equipo.jugador2}
              onChange={handleChange}
              placeholder="Nombre del jugador 2"
              required
            />
            <input
              type="text"
              name="jugador3"
              value={equipo.jugador3}
              onChange={handleChange}
              placeholder="Nombre del jugador 3"
              required
            />
            <input
              type="text"
              name="jugador4"
              value={equipo.jugador4}
              onChange={handleChange}
              placeholder="Nombre del jugador 4"
              required
            />

            <select
              name="categoria"
              className="select-list"
              value={equipo.categoria}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar categoría</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="senior">Senior</option>
            </select>


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
