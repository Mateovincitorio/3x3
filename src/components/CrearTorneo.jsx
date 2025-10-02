import React, { useState, useEffect } from 'react';
import './home.css';
import Navbar from './Navbar';
import './crearTorneo.css';
import './cruces.css';
import { db } from '../firebarseConfig.js';
import { collection, addDoc, getDocs, where, query } from 'firebase/firestore';
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

      // Guardar el equipo en la fase seleccionada -> categoría -> equipos
      const docRef = await addDoc(
        collection(db, `torneos/${equipo.torneo}/${equipo.fase}/${equipo.categoria}/equipos`),
        equipo
      );
      await addDoc(collection(db, `torneos/${equipo.torneo}/todosLosEquipos`), equipo);
      await addDoc(
        collection(db, `torneos/${equipo.torneo}/${equipo.fase}/${equipo.categoria}/zonas/${equipo.zona}/equipos`),
        equipo
      );
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
            equipoId: docRef.id,
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
      console.error("🔥 Error en handleSubmit:", error);
      toast.error('Ocurrió un error al crear el equipo', {
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
    }
  };

  // Nuevo: crear torneo
  const handleCrearTorneo = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "torneos"), { nombre: nombreTorneo });
      setNombreTorneo('');
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
          <h1 className="añadirh1">Añadí los equipos a tu Torneo</h1>
        </div>
        <div className="formulario">
          {/* Formulario para crear torneo */}
          <form onSubmit={handleCrearTorneo} style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              value={nombreTorneo}
              onChange={e => setNombreTorneo(e.target.value)}
              placeholder="Nombre del torneo"
              required
            />
            <button type="submit" className="boton">Crear Torneo</button>
          </form>
          {/* Formulario para crear equipo */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              value={equipo.nombre}
              onChange={handleChange}
              placeholder="Nombre del equipo"
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
              <option value="Senior">Senior</option>
            </select>
            <select
              name="fase"
              className="select-list"
              value={equipo.fase}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar fase</option>
              <option value="fase_de_grupos">Fase de Grupos</option>
              <option value="semifinales">Semifinales</option>
              <option value="finales">Final</option>
            </select>
            <select
              name="torneo"
              className="select-list"
              value={equipo.torneo}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar torneo</option>
              {torneos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre || t.id}</option>
              ))}
            </select>
            <select name="zona" id="zona" className="select-list" onChange={handleChange} required>
              <option value="">Seleccionar zona</option>
              <option value="a">a</option>
              <option value="b">b</option>
              <option value="c">c</option>
              <option value="d">d</option>
            </select>
            <button className="crearEquipo" type="submit">Crear Equipo</button>
            <button className="crearEquipo" type="button" onClick={() => window.location.href = '/'}>Volver a Home</button>
          </form>
        </div>
      <Cruces />
      </div>
      <ToastContainer />
    </>
  );
};

export default CrearTorneo;