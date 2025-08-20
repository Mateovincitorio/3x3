import React, { useEffect, useState } from 'react';
import './cruces.css';
import Navbar from './Navbar';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Cruces = () => {
  const [categoriaSel, setCategoriaSel] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [cruces, setCruces] = useState([]);
  const [resultados, setResultados] = useState([]);

  // Traer equipos al inicio
  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'equipos'));
        const equiposData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipos(equiposData);
      } catch (error) {
        console.error('Error al obtener equipos:', error);
      }
    };
    fetchEquipos();
  }, []);

  // Traer cruces filtrando por categoría
  useEffect(() => {
    const fetchCrucesPorCategoria = async () => {
      if (!categoriaSel) {
        setCruces([]); // Limpiar si no hay categoría
        return;
      }
      try {
        const q = query(collection(db, 'crucesGenerales'), where('categoria', '==', categoriaSel));
        const snapshot = await getDocs(q);
        const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCruces(crucesData);
      } catch (error) {
        console.error('Error al obtener cruces:', error);
      }
    };
    fetchCrucesPorCategoria();
  }, [categoriaSel]);

  // Traer resultados
  useEffect(() => {
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

  const obtenerEquiposCategoria = async (categoria) => {
    const ref = collection(db, 'categorias', categoria, 'equipos');
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const generarCruces = async () => {
    if (!categoriaSel) {
      toast.error('Seleccioná una categoría primero');
      return;
    }

    const equiposCat = await obtenerEquiposCategoria(categoriaSel);

    if (equiposCat.length < 2) {
      toast.info('No hay suficientes equipos en la categoría seleccionada');
      return;
    }

    const crucesArr = [];
    for (let i = 0; i < equiposCat.length; i++) {
      for (let j = i + 1; j < equiposCat.length; j++) {
        crucesArr.push({
          equipoA: equiposCat[i].nombre,
          equipoB: equiposCat[j].nombre,
          categoria: categoriaSel
        });
      }
    }

    // Guardar en Firestore
    const ref = collection(db, 'crucesGenerales');
    await Promise.all(crucesArr.map(c => addDoc(ref, c)));

    setCruces(crucesArr);

    toast.success('Cruces generados correctamente', {
      theme: 'colored',
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
    });
  };

  const handleResultado = async (local, visitante, ganador) => {
    setResultados(prev => {
      const indexExistente = prev.findIndex(
        r => (r.equipoA === local && r.equipoB === visitante) || (r.equipoA === visitante && r.equipoB === local)
      );
      if (indexExistente !== -1) {
        const nuevos = [...prev];
        nuevos[indexExistente] = { equipoA: local, equipoB: visitante, ganador };
        return nuevos;
      }
      return [...prev, { equipoA: local, equipoB: visitante, ganador }];
    });

    const idResultado = `${local}_vs_${visitante}`;
    await setDoc(doc(db, 'resultados', idResultado), {
      equipoA: local,
      equipoB: visitante,
      ganador,
    });
  };

  const eliminarColecciones = async () => {
    try {
      const colecciones = ['crucesGenerales', 'resultados', 'equipos', 'jugadores'];
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
            <button className="boton" onClick={generarCruces}>Generar Cruces</button>
            <select className="select-list" value={categoriaSel} onChange={(e) => setCategoriaSel(e.target.value)}>
              <option value="">Seleccionar categoría</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="Senior">Senior</option>
            </select>
            <button className="boton" onClick={eliminarColecciones}>Limpiar cruces y ganadores</button>
          </div>

          <ul className="lista-cruces">
            {cruces.length === 0 ? (
              <li>No hay cruces generados</li>
            ) : (
              cruces.map((cruce, index) => (
                <li className="card" key={index}>
                  <p>{cruce.equipoA} vs {cruce.equipoB}</p>
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
                {r.equipoA} vs {r.equipoB} - Ganador: <strong>{r.ganador}</strong>
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
