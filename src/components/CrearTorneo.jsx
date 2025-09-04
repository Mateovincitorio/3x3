import React, { useState } from 'react';
import './home.css';
import Navbar from './Navbar';
import './crearTorneo.css';
import { db } from '../firebarseConfig.js';
import { collection, addDoc, doc, setDoc, where, query, getDocs } from 'firebase/firestore';

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
    fase: ''
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
  // 🔹 1. Revisar qué valores tienen fase y categoría
  console.log("Fase:", equipo.fase);
  console.log("Categoría:", equipo.categoria);
  try {
    console.log("Equipo a guardar:", equipo);

    // 1️⃣ Verificar duplicados en todas las fases
    const fases = ["fase_de_grupos", "semifinales", "finales"];
    let duplicado = false;

    for (let fase of fases) {
      const q = query(
        collection(db, `${fase}/${equipo.categoria}/equipos`),
        where("nombre", "==", equipo.nombre)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        duplicado = true;
        break;
      }
    }

    if (duplicado) {
      toast.error('Ya existe un equipo con el mismo nombre en esta categoría.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
      return;
    }

    // 2️⃣ Guardar el equipo en la fase seleccionada -> categoría -> equipos
    const docRef = await addDoc(
      collection(db, `${equipo.fase}/${equipo.categoria}/equipos`),
      equipo
    );
    console.log("Equipo creado en fase", equipo.fase, "con ID:", docRef.id);

    // 3️⃣ Crear jugadores
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
          equipoId: docRef.id,
          categoria: equipo.categoria
        });
      }
    }
    console.log("Jugadores creados");

    // 4️⃣ Resetear formulario
    setEquipo({
      nombre: '',
      jugador1: '',
      jugador2: '',
      jugador3: '',
      jugador4: '',
      categoria: '',
      fase: ''
    });

    // 5️⃣ Notificación de éxito
    toast.success('Equipo y jugadores creados correctamente', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
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
      style: { backgroundColor: '#800080', color: '#fff' }
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
          <select
            name="fase"
            className='select-list'
            value={equipo.fase}
            onChange={handleChange}
            required
          >         
            <option value="">Seleccionar fase</option>
            <option value="fase_de_grupos">Fase de Grupos</option>
            <option value="semifinales">Semifinales</option>
            <option value="finales">Final</option>
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
