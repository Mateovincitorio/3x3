

//================================
//ARREGLAR UPDATE
//================================



















import React, { useState, useEffect } from 'react';
import Navbar from "./Navbar";
import './home.css';
import './equipos.css';
import './cruces.css';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { getDoc } from "firebase/firestore";
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Equipos = () => {
  const [torneos, setTorneos] = useState([]);
  const [torneoSel, setTorneoSel] = useState('');
  const [faseSel, setFaseSel] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [zonaSel, setZonaSel] = useState('');

  const [zonas, setZonas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    fase: "",
    zona: ""
  });

  // 🟢 Obtener torneos
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

  // 🟢 Generar zonas dinámicas según torneo seleccionado
  useEffect(() => {
    if (!torneoSel) {
      setZonas([]);
      return;
    }

    const torneo = torneos.find(t => t.id === torneoSel);
    if (torneo?.zonas && torneo.zonas > 0) {
      const zonasArray = Array.from({ length: torneo.zonas }, (_, i) => `zona${i + 1}`);
      setZonas(zonasArray);
    } else {
      setZonas([]);
    }
  }, [torneoSel, torneos]);

  // 🟢 Obtener equipos
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!torneoSel) return;
      try {
        const snapshot = await getDocs(collection(db, `torneos/${torneoSel}/todosLosEquipos`));
        const equiposData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipos(equiposData);
      } catch (error) {
        console.error('Error al obtener los equipos:', error);
      }
    };
    fetchEquipos();
  }, [torneoSel]);

  // 🟡 Editar equipo
  const handleEdit = (equipo) => {
  setEditando(equipo.id);
  setFormData({
    nombre: equipo.nombre || "",
    categoria: equipo.categoria || "",
    fase: equipo.fase || "",
    zona: equipo.zona || ""
  });
};


  // 🟡 Actualizar equipo en las 3 ubicaciones
const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    if (!formData.fase || !formData.categoria || !formData.zona) {
      toast.error("Completa todos los campos antes de guardar");
      return;
    }

    // Buscar datos originales del equipo antes de editar
    const equipoViejo = equipos.find(eq => eq.id === editando);
    if (!equipoViejo) {
      toast.error("No se encontró el equipo original");
      return;
    }

    // 🔹 Actualizar en todosLosEquipos (siempre)
    const todosRef = doc(db, "torneos", torneoSel, "todosLosEquipos", editando);
    await setDoc(todosRef, formData, { merge: true });

    // 🔹 Si cambió fase, categoría o zona, eliminar documentos viejos
    if (
      equipoViejo.fase !== formData.fase ||
      equipoViejo.categoria !== formData.categoria ||
      equipoViejo.zona !== formData.zona
    ) {
      const oldCatRef = doc(
        db,
        "torneos",
        torneoSel,
        equipoViejo.fase,
        equipoViejo.categoria,
        "equipos",
        editando
      );
      const oldZonaRef = doc(
        db,
        "torneos",
        torneoSel,
        equipoViejo.fase,
        equipoViejo.categoria,
        "zonas",
        equipoViejo.zona,
        "equipos",
        editando
      );

      await deleteDoc(oldCatRef).catch(() => {});
      await deleteDoc(oldZonaRef).catch(() => {});
    }

    // 🔹 Crear/actualizar en la nueva categoría
    const newCatRef = doc(
      db,
      "torneos",
      torneoSel,
      formData.fase,
      formData.categoria,
      "equipos",
      editando
    );
    await setDoc(newCatRef, formData, { merge: true });

    // 🔹 Crear/actualizar en la nueva zona
    const newZonaRef = doc(
      db,
      "torneos",
      torneoSel,
      formData.fase,
      formData.categoria,
      "zonas",
      formData.zona,
      "equipos",
      editando
    );
    await setDoc(newZonaRef, formData, { merge: true });

    // 🔹 Actualizar estado local
    setEquipos((prev) =>
      prev.map((eq) => (eq.id === editando ? { ...eq, ...formData } : eq))
    );
    setEditando(null);

    toast.success("Equipo actualizado correctamente en todas las ubicaciones", {
      position: "top-right",
      autoClose: 3000,
      theme: "colored",
      transition: Bounce,
      style: { backgroundColor: "#800080", color: "#fff" },
    });
  } catch (error) {
    console.error("Error actualizando equipo:", error);
    toast.error("Error al actualizar el equipo");
  }
};




  // 🔴 Eliminar equipo en las 3 ubicaciones
const handleDelete = async (id, e) => {
  e.preventDefault();

  try {
    // Buscar equipo en el estado
    const equipo = equipos.find(eq => eq.id === id);
    if (!equipo) throw new Error("Equipo no encontrado en el estado");

    const { fase, categoria, zona } = equipo;

    // Array con todas las rutas a eliminar
    const rutas = [
      `torneos/${torneoSel}/todosLosEquipos/${id}`,
      `torneos/${torneoSel}/${fase}/${categoria}/equipos/${id}`,
      `torneos/${torneoSel}/${fase}/${categoria}/zonas/${zona}/equipos/${id}`
    ];

    // Iterar rutas secuencialmente
    for (let ruta of rutas) {
      const ref = doc(db, ...ruta.split("/"));
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        await deleteDoc(ref);
        console.log("✅ Documento eliminado:", ruta);
      } else {
        console.warn("⚠ Documento no encontrado, no se puede eliminar:", ruta);
      }
    }

    // Actualizar estado local
    setEquipos(prev => prev.filter(eq => eq.id !== id));

    toast.success('Equipo eliminado correctamente de todas las ubicaciones', {
      theme: "colored",
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
    });

  } catch (error) {
    console.error("Error eliminando equipo:", error);
    toast.error('Error al eliminar el equipo', {
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
        <div className="contenedor-div">
          <select value={torneoSel} onChange={e => setTorneoSel(e.target.value)} className="select-list">
            <option value="">Select Tournament</option>
            {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre || t.id}</option>)}
          </select>

          <select value={faseSel} onChange={e => setFaseSel(e.target.value)} className="select-list">
            <option value="">Select Phase</option>
            <option value="fase_de_grupos">Fase de Grupos</option>
            <option value="semifinales">Semifinales</option>
            <option value="finales">Finales</option>
          </select>

          <select value={categoriaSel} onChange={e => setCategoriaSel(e.target.value)} className="select-list">
            <option value="">Select Category</option>
            <option value="U14">U14</option>
            <option value="U16">U16</option>
            <option value="U18">U18</option>
            <option value="Senior">Senior</option>
          </select>

          <select value={zonaSel} onChange={e => setZonaSel(e.target.value)} className="select-list">
            <option value="">Select Zone</option>
            {zonas.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div className="listaEquipos">
          <h1 className='equipos'>Participating Teams</h1>
          <div className="contenedorEquipos">
            {equipos.map((equipo) => (
              <div className="cardEquipo" key={equipo.id}>
                {editando === equipo.id ? (
                  <form onSubmit={handleUpdate}>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                    <select
                      className="select-list"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                      <option value="">Select Category</option>
                      <option value="U14">U14</option>
                      <option value="U16">U16</option>
                      <option value="U18">U18</option>
                      <option value="Senior">Senior</option>
                    </select>
                    <select
                      className="select-list"
                      value={formData.fase}
                      onChange={(e) => setFormData({ ...formData, fase: e.target.value })}>
                      <option value="">Select Phase</option>
                      <option value="fase_de_grupos">Fase de Grupos</option>
                      <option value="semifinales">Semifinales</option>
                      <option value="finales">Finales</option>
                    </select>
                    <select
                      className="select-list"
                      value={formData.zona}
                      onChange={(e) => setFormData({ ...formData, zona: e.target.value })}>
                      <option value="">Select Zone</option>
                      {zonas.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <button className="boton-editar" type="submit">Save</button>
                    <button className="boton-editar" type="button" onClick={() => setEditando(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <h2>{equipo.nombre}</h2>
                    <button className="boton" onClick={(e) => handleDelete(equipo.id, e)}>Delete</button>
                    <button className="boton" onClick={() => handleEdit(equipo)}>Edit</button>
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
