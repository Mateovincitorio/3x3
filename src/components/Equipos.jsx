import React, { useState, useEffect } from 'react';
import Navbar from "./Navbar";
import './home.css';
import './equipos.css';
import './cruces.css';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Equipos = () => {
  const [torneos, setTorneos] = useState([]);
  const [torneoSel, setTorneoSel] = useState('');
  const [faseSel, setFaseSel] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [zonaSel, setZonaSel] = useState('');
  
  const [equipos, setEquipos] = useState([]);
  const [editando, setEditando] = useState(null); // id del equipo en edición
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    fase: "",
  });

  // Cargar torneos al montar el componente
  useEffect(() => {
    const fetchTorneos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "torneos"));
        const torneosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTorneos(torneosData);
      } catch (error) {
        console.error("Error al cargar torneos:", error);
      }
    };
    fetchTorneos();
  }, []);

  // Cargar equipos cuando cambien los filtros
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!torneoSel || !faseSel || !categoriaSel || !zonaSel) return;

      try {
        const path = `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/equipos`;
        const querySnapshot = await getDocs(collection(db, path));
        const equiposData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEquipos(equiposData);
      } catch (error) {
        console.error('Error al obtener los equipos:', error);
      }
    };

    fetchEquipos();
  }, [torneoSel, faseSel, categoriaSel, zonaSel]);

  const handleEdit = (equipo) => {
    setEditando(equipo.id);
    setFormData(equipo); // Cargar datos actuales en el formulario
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const equipoRef = doc(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/equipos`, editando);
      await updateDoc(equipoRef, formData);

      setEquipos(prev => prev.map(eq => eq.id === editando ? { ...eq, ...formData } : eq));
      setEditando(null);
      toast.success('Equipo editado correctamente', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
    } catch (error) {
      console.error("Error editando documento: ", error);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    try {
      const equipoRef = doc(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/equipos`, id);
      await deleteDoc(equipoRef);
      setEquipos(prev => prev.filter(eq => eq.id !== id));
      toast.success('Equipo eliminado correctamente', {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
    } catch (error) {
      console.error("Error eliminando documento: ", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="body">
        <div className="contenedor-div">
          <select value={torneoSel} onChange={e => setTorneoSel(e.target.value)} className="select-list">
            <option value="">Seleccionar torneo</option>
            {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre || t.id}</option>)}
          </select>
          <select value={faseSel} onChange={e => setFaseSel(e.target.value)} className="select-list">
            <option value="">Seleccionar fase</option>
            <option value="fase_de_grupos">Fase de Grupos</option>
            <option value="semifinales">Semifinales</option>
            <option value="finales">Finales</option>
          </select>
          <select value={categoriaSel} onChange={e => setCategoriaSel(e.target.value)} className="select-list">
            <option value="">Seleccionar categoría</option>
            <option value="U14">U14</option>
            <option value="U16">U16</option>
            <option value="U18">U18</option>
            <option value="Senior">Senior</option>
          </select>
          <select value={zonaSel} onChange={e => setZonaSel(e.target.value)} className="select-list">
            <option value="">Seleccionar zona</option>
            <option value="a">a</option>
            <option value="b">b</option>
            <option value="c">c</option>
            <option value="d">d</option>
          </select>
        </div>

        <div className="listaEquipos">
          <h1 className='equipos'>Equipos Participantes</h1>
          <div className="contenedorEquipos">
            {equipos.map((equipo) => (
              <div className="cardEquipo" key={equipo.id}>
                {editando === equipo.id ? (
                  <form onSubmit={handleUpdate}>
                    <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                    <select className="select-list" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                      <option value="">Seleccionar categoría</option>
                      <option value="U14">U14</option>
                      <option value="U16">U16</option>
                      <option value="U18">U18</option>
                      <option value="Senior">Senior</option>
                    </select>
                    <select className="select-list" value={formData.fase} onChange={(e) => setFormData({ ...formData, fase: e.target.value })}>
                      <option value="">Seleccionar fase</option>
                      <option value="fase_de_grupos">Fase de Grupos</option>
                      <option value="semifinales">Semifinales</option>
                      <option value="finales">Finales</option>
                    </select>
                    <button className="boton-editar" type="submit">Guardar</button>
                    <button className="boton-editar" type="button" onClick={() => setEditando(null)}>Cancelar</button>
                  </form>
                ) : (
                  <>
                    <h2>{equipo.nombre}</h2>
                    <button className="boton" onClick={(e) => handleDelete(equipo.id, e)}>Eliminar</button>
                    <button className="boton" onClick={() => handleEdit(equipo)}>Editar</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Equipos;
