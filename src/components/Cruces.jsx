import React, { useEffect, useState } from 'react';
import './cruces.css';
import Navbar from './Navbar';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Cruces = () => {
  const [categoriaSel, setCategoriaSel] = useState('');
  const [faseSel, setFaseSel] = useState('');
  const [equipos, setEquipos] = useState([]); // 👈 ahora depende de fase/categoria
  const [cruces, setCruces] = useState([]);
  const [resultados, setResultados] = useState([]);

  // 👉 obtener equipos de la ruta fase/categoria/equipos
  const obtenerEquiposCategoria = async (fase, categoria) => {
    if (!fase || !categoria) return [];
    const equiposRef = collection(db, `${fase}/${categoria}/equipos`);
    const snapshot = await getDocs(equiposRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // 👉 cargar equipos cuando se cambia fase o categoría
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!faseSel || !categoriaSel) {
        setEquipos([]);
        return;
      }
      try {
        const equiposCat = await obtenerEquiposCategoria(faseSel, categoriaSel);
        setEquipos(equiposCat);
      } catch (error) {
        toast.error('Error al cargar equipos', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark',
        });
        console.error('Error al cargar equipos:', error);
      }
    };
    fetchEquipos();
  }, [faseSel, categoriaSel]);

  // 👉 cargar cruces cuando se cambia fase o categoría
  useEffect(() => {
    const fetchCruces = async () => {
      if (!categoriaSel || !faseSel) {
        setCruces([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'crucesGenerales'),
          where('categoria', '==', categoriaSel),
          where('fase', '==', faseSel)
        );
        const snapshot = await getDocs(q);
        const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCruces(crucesData);
      } catch (error) {
        console.error('Error al obtener cruces:', error);
      }
    };
    fetchCruces();
  }, [categoriaSel, faseSel]);

  // 👉 cargar resultados globales
  /*useEffect(() => {
    const fetchResultados = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'resultados'));
        const resultadosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResultados(resultadosData);
      } catch (error) {
        console.error('Error al obtener resultados:', error);
      }
    };
    fetchResultados();
  }, []);
*/
  const generarCruces = async () => {
    if (!categoriaSel || !faseSel) {
      toast.error('Seleccioná categoría y fase primero'),{
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      }
      return;
    }

    if (equipos.length < 2) {
      toast.info('No hay suficientes equipos en la categoría y fase seleccionada');
      return;
    }

    const crucesArr = [];
    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        crucesArr.push({
          equipoA: equipos[i].nombre,
          equipoB: equipos[j].nombre,
          categoria: categoriaSel,
          fase: faseSel
        });
      }
    }

    const ref = collection(db, 'crucesGenerales');
    await Promise.all(crucesArr.map(c => addDoc(ref, c)));

    const q = query(
      collection(db, 'crucesGenerales'),
      where('categoria', '==', categoriaSel),
      where('fase', '==', faseSel)
    );
    const snapshot = await getDocs(q);
    const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCruces(crucesData);

    toast.success('Cruces generados correctamente', {
      theme: 'colored',
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
    });
  };

  const handleResultado = async (local, visitante, ganador) => {
    setResultados(prev => {
      const indexExistente = prev.findIndex(
        r =>
          (r.equipoA === local && r.equipoB === visitante) ||
          (r.equipoA === visitante && r.equipoB === local)
      );
      if (indexExistente !== -1) {
        const nuevos = [...prev];
        nuevos[indexExistente] = { equipoA: local, equipoB: visitante, ganador, fase: faseSel };
        return nuevos;
      }
      return [...prev, { equipoA: local, equipoB: visitante, ganador, fase: faseSel }];
    });

    const idResultado = `${local}_vs_${visitante}_${faseSel}`;
    await setDoc(doc(db, 'resultados', idResultado), {
      equipoA: local,
      equipoB: visitante,
      ganador,
      fase: faseSel
    });
  };

  const eliminarColecciones = async () => {
    try {
      const colecciones = ['crucesGenerales', 'resultados'];
      for (const nombre of colecciones) {
        const snapshot = await getDocs(collection(db, nombre));
        const promesas = snapshot.docs.map(d => deleteDoc(doc(db, nombre, d.id)));
        await Promise.all(promesas);
      }
      setCruces([]);
      setResultados([]);
      toast.success('Colecciones eliminadas ✅', {
        theme: 'colored',
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
    } catch (error) {
      console.error('Error al eliminar colecciones:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="body">
        <div className="contenedor">
          <div className="contenedor-div">
            <button className="boton" onClick={generarCruces} disabled={equipos.length === 0}>Generar Cruces</button>

            <select className="select-list" value={categoriaSel} onChange={(e) => setCategoriaSel(e.target.value)}>
              <option value="">Seleccionar categoría</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="Senior">Senior</option>
            </select>

            <select className="select-list" value={faseSel} onChange={(e) => setFaseSel(e.target.value)}>
              <option value="">Seleccionar fase</option>
              <option value="fase_de_grupos">Fase de Grupos</option>
              <option value="semifinales">Cuartos de Final</option>
              <option value="finales">Semifinal</option>
            </select>

            <button className="boton" onClick={eliminarColecciones}>Limpiar cruces y ganadores</button>
          </div>

          <ul className="lista-cruces">
            {cruces.length === 0 ? (
              <li>No hay cruces generados</li>
            ) : (
              cruces.map((cruce, index) => (
                <li className="card" key={index}>
                  <p>{cruce.equipoA} vs {cruce.equipoB} ({cruce.fase})</p>
                  <button onClick={() => handleResultado(cruce.equipoA, cruce.equipoB, cruce.equipoA)}>
                    Ganador: {cruce.equipoA}
                  </button>
                  <button onClick={() => handleResultado(cruce.equipoA, cruce.equipoB, cruce.equipoB)}>
                    Ganador: {cruce.equipoB}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="resultados">
          <h2>Resultados</h2>
          {resultados.length === 0 ? (
            <p>No hay resultados aún</p>
          ) : (
            resultados.map((r, index) => (
              <h3 key={index}>
                {r.equipoA} vs {r.equipoB} - Ganador: <strong>{r.ganador}</strong> ({r.fase})
              </h3>
            ))
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Cruces;
