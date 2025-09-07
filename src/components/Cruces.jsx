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
  const [equipos, setEquipos] = useState([]);
  const [cruces, setCruces] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [marcadores, setMarcadores] = useState({});
  const [tablaPosiciones, setTablaPosiciones] = useState([]);

  // 👉 obtener equipos de la ruta fase/categoria/equipos
  const obtenerEquiposCategoria = async (fase, categoria) => {
    if (!fase || !categoria) return [];
    const equiposRef = collection(db, `${fase}/${categoria}/equipos`);
    const snapshot = await getDocs(equiposRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // 👉 limpiar todo cuando cambia fase o categoría
  useEffect(() => {
    setEquipos([]);
    setCruces([]);
    setResultados([]);
    setTablaPosiciones([]);
  }, [faseSel, categoriaSel]);

  // 👉 cargar equipos cuando se cambia fase o categoría
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!faseSel || !categoriaSel) return;
      try {
        const equiposCat = await obtenerEquiposCategoria(faseSel, categoriaSel);
        setEquipos(equiposCat);
      } catch (error) {
        toast.error('Error al cargar equipos');
        console.error('Error al cargar equipos:', error);
      }
    };
    fetchEquipos();
  }, [faseSel, categoriaSel]);

  // 👉 cargar cruces y resultados filtrados
  useEffect(() => {
    const fetchDatos = async () => {
      if (!categoriaSel || !faseSel) return;

      try {
        // resultados filtrados
        const qRes = query(
          collection(db, 'resultados'),
          where('categoria', '==', categoriaSel),
          where('fase', '==', faseSel)
        );
        const snapshotRes = await getDocs(qRes);
        const resultadosData = snapshotRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResultados(resultadosData);

        // cruces filtrados
        const qCru = query(
          collection(db, 'crucesGenerales'),
          where('categoria', '==', categoriaSel),
          where('fase', '==', faseSel)
        );
        const snapshotCru = await getDocs(qCru);
        const crucesData = snapshotCru.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCruces(crucesData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };
    fetchDatos();
  }, [categoriaSel, faseSel]);

  const generarCruces = async () => {
    if (!categoriaSel || !faseSel) {
      toast.error('Seleccioná categoría y fase primero');
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

    // recargar cruces filtrados
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

  const handleResultado = async (local, visitante, ganador, marcador) => {
    setResultados(prev => {
      const indexExistente = prev.findIndex(
        r =>
          (r.equipoA === local && r.equipoB === visitante) ||
          (r.equipoA === visitante && r.equipoB === local)
      );
      if (indexExistente !== -1) {
        const nuevos = [...prev];
        nuevos[indexExistente] = { equipoA: local, equipoB: visitante, ganador, fase: faseSel, categoria: categoriaSel, marcador };
        return nuevos;
      }
      return [...prev, { equipoA: local, equipoB: visitante, ganador, fase: faseSel, categoria: categoriaSel, marcador }];
    });

    const idResultado = `${local}_vs_${visitante}_${faseSel}_${categoriaSel}`;
    await setDoc(doc(db, 'resultados', idResultado), {
      equipoA: local,
      equipoB: visitante,
      ganador,
      marcador,
      fase: faseSel,
      categoria: categoriaSel
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

  const handleMarcadorChange = (id, value) => {
    const regex = /^\d{0,2}-?\d{0,2}$/;
    if (regex.test(value)) {
      setMarcadores(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const generarTablaPosiciones = () => {
    if (resultados.length === 0) return;

    const equiposStats = {};
    equipos.forEach(e => {
      equiposStats[e.nombre] = {
        nombre: e.nombre,
        ganados: 0,
        perdidos: 0,
        puntosAFavor: 0,
        puntosEnContra: 0,
        diferencia: 0
      };
    });

    resultados.forEach(r => {
      if (!r.marcador) return;
      const [golesA, golesB] = r.marcador.split('-').map(n => parseInt(n, 10));
      const eqA = equiposStats[r.equipoA];
      const eqB = equiposStats[r.equipoB];

      if (!eqA || !eqB) return;

      eqA.puntosAFavor += golesA;
      eqA.puntosEnContra += golesB;
      eqB.puntosAFavor += golesB;
      eqB.puntosEnContra += golesA;

      eqA.diferencia = eqA.puntosAFavor - eqA.puntosEnContra;
      eqB.diferencia = eqB.puntosAFavor - eqB.puntosEnContra;

      if (r.ganador === r.equipoA) {
        eqA.ganados += 1;
        eqB.perdidos += 1;
      } else if (r.ganador === r.equipoB) {
        eqB.ganados += 1;
        eqA.perdidos += 1;
      }
    });

    const dosOMas = Object.values(equiposStats).filter(e => e.ganados >= 2);
    const uno = Object.values(equiposStats).filter(e => e.ganados === 1);
    const cero = Object.values(equiposStats).filter(e => e.ganados === 0);

    dosOMas.sort((a, b) => b.diferencia - a.diferencia);
    uno.sort((a, b) => b.diferencia - a.diferencia);
    cero.sort((a, b) => b.diferencia - a.diferencia);

    const tablaFinal = [...dosOMas, ...uno, ...cero];
    setTablaPosiciones(tablaFinal);
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
              <option value="semifinales">Semifinales</option>
              <option value="finales">Finales</option>
            </select>

            <button className="boton" onClick={eliminarColecciones}>Limpiar cruces y ganadores</button>
          </div>

          <ul className="lista-cruces">
            {cruces.length === 0 ? (
              <li>No hay cruces generados</li>
            ) : (
              cruces.map((cruce) => (
                <li className="card" key={cruce.id}>
                  <p>{cruce.equipoA} vs {cruce.equipoB}</p>
                  <input
                    type="text"
                    placeholder="Ej: 21-10"
                    value={marcadores[cruce.id] || ""}
                    onChange={(e) => handleMarcadorChange(cruce.id, e.target.value)}
                  />
                  <button
                    onClick={() =>
                      handleResultado(
                        cruce.equipoA,
                        cruce.equipoB,
                        cruce.equipoA,
                        marcadores[cruce.id] || ""
                      )
                    }
                  >
                    Ganador: {cruce.equipoA}
                  </button>
                  <button
                    onClick={() =>
                      handleResultado(
                        cruce.equipoA,
                        cruce.equipoB,
                        cruce.equipoB,
                        marcadores[cruce.id] || ""
                      )
                    }
                  >
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
                {r.equipoA} vs {r.equipoB} - 
                Ganador: <strong>{r.ganador}</strong> - 
                Puntos: <strong>{r.marcador}</strong>
              </h3>
            ))
          )}
        </div>

        <div className="tabla-posiciones">
          <h2>Tabla de posiciones de {faseSel}</h2>
          <button className='boton' onClick={generarTablaPosiciones}>Crear tabla</button>
          <ul>
            {tablaPosiciones.map((e, i) => (
              <li key={i} className="grillali">
                {i + 1}. {e.nombre} - Ganados: {e.ganados}, Perdidos: {e.perdidos}, 
                Puntos a favor: {e.puntosAFavor}, Puntos en contra: {e.puntosEnContra}, diferencia: {e.diferencia}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Cruces;
