import React, { useState, useEffect } from 'react';
import './home.css';
import Navbar from './Navbar';
import './crearTorneo.css';
import './cruces.css';
import { db } from '../firebarseConfig.js';
import { collection, addDoc, getDocs, where, query, setDoc, doc } from 'firebase/firestore';

import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cruces from './Cruces.jsx';
import './cruces.css';

const CrearTorneo = () => {
  const [equipo, setEquipo] = useState({
    nombre: '',
    jugador1: '',
    jugador2: '',
    jugador3: '',
    jugador4: '',
    categoria: '',
    fase: '',
    torneo: '',
    zona: ''
  });

  const [torneos, setTorneos] = useState([]);
  const [nombreTorneo, setNombreTorneo] = useState('');
  const [fechaInicioTorneo, setFechaInicioTorneo] = useState('');
  const [fechaFinTorneo, setFechaFinTorneo] = useState('');
  const [canchasTorneo, setCanchasTorneo] = useState(0);
  const [zonasTorneo, setZonasTorneo] = useState(0)
  

  useEffect(() => {
    const fetchTorneos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "torneos"));
        const torneosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTorneos(torneosData);
      } catch (error) {
        console.error("Error al traer torneos:", error);
      }
    };
    fetchTorneos();
  }, []);
  

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
    // Verificar duplicados en todas las fases
    const fases = ["fase_de_grupos", "semifinales", "finales"];
    let duplicado = false;

    for (let fase of fases) {
      const q = query(
        collection(db, `torneos/${equipo.torneo}/${fase}/${equipo.categoria}/equipos`),
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
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
      return;
    }

    // 🔹 Generar ID único para el equipo
    const equipoId = doc(collection(db, `torneos/${equipo.torneo}/todosLosEquipos`)).id;

    // Datos del equipo
    const nuevoEquipo = { ...equipo };

    // 🔹 Guardar en las 3 ubicaciones con el mismo ID
    await Promise.all([
      setDoc(doc(db, `torneos/${equipo.torneo}/todosLosEquipos`, equipoId), nuevoEquipo),
      setDoc(doc(db, `torneos/${equipo.torneo}/${equipo.fase}/${equipo.categoria}/equipos`, equipoId), nuevoEquipo),
      setDoc(doc(db, `torneos/${equipo.torneo}/${equipo.fase}/${equipo.categoria}/zonas/${equipo.zona}/equipos`, equipoId), nuevoEquipo)
    ]);

    // Crear jugadores
    const jugadoresArray = [
      equipo.jugador1,
      equipo.jugador2,
      equipo.jugador3,
      equipo.jugador4
    ];

    for (let jugador of jugadoresArray) {
      if (jugador.trim() !== "") {
        await addDoc(collection(db, `torneos/${equipo.torneo}/${equipo.fase}/${equipo.categoria}/jugadores`), {
          nombre: jugador,
          equipoId: equipoId,
          categoria: equipo.categoria
        });
      }
    }

    setEquipo({
      nombre: '',
      jugador1: '',
      jugador2: '',
      jugador3: '',
      jugador4: '',
      categoria: '',
      fase: '',
      torneo: '',
      zona: ''
    });

    toast.success('Equipo y jugadores creados correctamente', {
      theme: "colored",
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
    });

  } catch (error) {
    toast.error('Ocurrió un error al crear el equipo', {
      theme: "colored",
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
    });
    console.error(error);
  }
};


  // Nuevo: crear torneo
  const handleCrearTorneo = async (e) => {
    e.preventDefault();
    try {
      // Guardar torneo con fechas
      const numCanchas = Number(canchasTorneo);
      const numZonas = Number(zonasTorneo);
      const torneoData = {
        nombre: nombreTorneo,
        fechaInicio: fechaInicioTorneo,
        fechaFin: fechaFinTorneo,
        canchas: numCanchas,
        zonas: numZonas
      };
      await addDoc(collection(db, "torneos"), torneoData);
      setCanchasTorneo(numCanchas);
      // Resetear formulario
      setNombreTorneo('');
      setFechaInicioTorneo('');
      setFechaFinTorneo('');
      toast.success('Torneo creado correctamente', {
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
      // Actualizar lista de torneos
      const snapshot = await getDocs(collection(db, "torneos"));
      const torneosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTorneos(torneosData);
    } catch (error) {
      toast.error('Error al crear torneo');
    }
  };

  return (
    <>
      <Navbar />
      <div className="body">
        <div className="contenedor">
          <h1 className="añadirh1">add teams to your tournament</h1>
        </div>
        <div className="formulario">
          {/* Formulario para crear torneo */}
          <form onSubmit={handleCrearTorneo} style={{ marginBottom: '2rem' }}>
            <h4 className='h4input'>Name of the tournament</h4>
            <input
              type="text"
              value={nombreTorneo}
              onChange={e => setNombreTorneo(e.target.value)}
              placeholder="Name of the tournament"
              required
            />
            <h4 className='h4input'>Start Date</h4>
            <input
              type="datetime-local"
              value={fechaInicioTorneo}
              onChange={e => setFechaInicioTorneo(e.target.value)}
              placeholder="Start Date"
              required
            />
            <h4 className='h4input'>End Date</h4>
            <input 
              type="datetime-local"
              value={fechaFinTorneo}
              onChange={e => setFechaFinTorneo(e.target.value)}
              placeholder="End Date"
              required
            />
            <h4 className='h4input'>NNumber of Courts</h4>
            <input 
              type="number" 
              name="numCanchas" 
              value={canchasTorneo} 
              onChange={e => setCanchasTorneo(Number(e.target.value))} 
              placeholder='Introduce number of courts (max 8)' 
            />
            <h4 className='h4input'>Number of Zones</h4>
            <input 
              type="number" 
              name="numZonas"
              value={zonasTorneo}
              min={1}
              onChange={e=>setZonasTorneo(Number(e.target.value))}/>
            <button type="submit" className="boton">Create Tournament</button>
          </form>
          {/* Formulario para crear equipo */}
          <form onSubmit={handleSubmit}>
  <input
    type="text"
    name="nombre"
    value={equipo.nombre}
    onChange={handleChange}
    placeholder="Team Name"
    required
  />

  <select
    name="categoria"
    className="select-list"
    value={equipo.categoria}
    onChange={handleChange}
    required
  >
    <option value="">Select Category</option>
    <option value="U14">U14</option>
    <option value="U16">U16</option>
    <option value="U18">U18</option>
    <option value="Senior">Senior</option>
  </select>

  <select
    name="fase"
    className="select-list"
    value={equipo.fase}
    onChange={handleChange}
    required
  >
    <option value="">Select Phase</option>
    <option value="fase_de_grupos">Fase de Grupos</option>
    <option value="semifinales">Semifinales</option>
    <option value="finales">Final</option>
  </select>

  <select
    name="torneo"
    className="select-list"
    value={equipo.torneo}
    onChange={(e) => {
      handleChange(e);
      setEquipo(prev => ({ ...prev, zona: "" })); // reset zona al cambiar torneo
    }}
    required
  >
    <option value="">Select Tournament</option>
    {torneos.map(t => (
      <option key={t.id} value={t.id}>{t.nombre || t.id}</option>
    ))}
  </select>

  <select
    name="zona"
    className="select-list"
    value={equipo.zona}
    onChange={handleChange}
    required
    disabled={!equipo.torneo} // deshabilitar si no se seleccionó torneo
  >
    <option value="">Select Zone</option>
    {equipo.torneo && torneos.find(t => t.id === equipo.torneo)?.zonas > 0 &&
      [...Array(torneos.find(t => t.id === equipo.torneo).zonas)].map((_, i) => (
        <option key={i} value={`zona${i + 1}`}>Zona {i + 1}</option>
      ))
    }
  </select>

  <button className="crearEquipo" type="submit">Create Team</button>
</form>

        </div>
      <Cruces torneos={torneos} canchasTorneo={canchasTorneo} numZonas={zonasTorneo} />
      </div>
      <ToastContainer />
    </>
  );
};

export default CrearTorneo;