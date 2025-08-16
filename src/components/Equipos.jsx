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
  const [equipos, setEquipos] = useState([]);
  const [editando, setEditando] = useState(null); // id del equipo en edición
  const [formData, setFormData] = useState({
    nombre: "",
    jugador1: "",
    jugador2: "",
    jugador3: "",
    jugador4: "",
    categoria: "",
    zona: ""
  });

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'equipos'));
        const equiposData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setEquipos(equiposData);
      } catch (error) {
        console.error('Error al obtener los equipos:', error);
      }
    };

    fetchEquipos();
  }, []);

  const handleEdit = (equipo) => {
    setEditando(equipo.id);
    setFormData(equipo); // Cargar datos actuales en el formulario
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const equipoRef = doc(db, "equipos", editando);
      await updateDoc(equipoRef, formData);

      setEquipos((prevEquipos) =>
        prevEquipos.map((eq) =>
          eq.id === editando ? { ...eq, ...formData } : eq
        )
      );

      setEditando(null); // salir de modo edición
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
      await deleteDoc(doc(db, "equipos", id));
      setEquipos((prevEquipos) => prevEquipos.filter((equipo) => equipo.id !== id));
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
        <div className="listaEquipos">
          <h1 className='equipos'>Equipos Participantes</h1>
          <div className="contenedorEquipos">
            {equipos.map((equipo) => (
              <div className="cardEquipo" key={equipo.id}>
                {editando === equipo.id ? (
                  <form onSubmit={handleUpdate}>
                    <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                    <input type="text" value={formData.jugador1} onChange={(e) => setFormData({ ...formData, jugador1: e.target.value })} />
                    <input type="text" value={formData.jugador2} onChange={(e) => setFormData({ ...formData, jugador2: e.target.value })} />
                    <input type="text" value={formData.jugador3} onChange={(e) => setFormData({ ...formData, jugador3: e.target.value })} />
                    <input type="text" value={formData.jugador4} onChange={(e) => setFormData({ ...formData, jugador4: e.target.value })} />
                    <input type="text" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} />
                    <input type="text" value={formData.zona} onChange={(e) => setFormData({ ...formData, zona: e.target.value })} />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setEditando(null)}>Cancelar</button>
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
