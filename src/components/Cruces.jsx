import React, { useEffect, useState } from 'react';
import './cruces.css';
import './crearTorneo.css'
import Navbar from './Navbar';
import { collection, getDocs, addDoc, doc, setDoc, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DateTimePicker from './DateTimePicker';

const Cruces = () => {
  const [categoriaSel, setCategoriaSel] = useState('');
  const [faseSel, setFaseSel] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [cruces, setCruces] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [marcadores, setMarcadores] = useState({});
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [torneoSel, setTorneoSel] = useState("");
  const [zonaSel, setZonaSel] = useState('');
  const [fechasCruces, setFechasCruces] = useState({}); // { idCruce: Date }

  // Obtener equipos
  const obtenerEquiposCategoria = async (torneo, fase, categoria, zona) => {
    if (!torneo || !fase || !categoria || !zona) return [];
    const path = `torneos/${torneo}/${fase}/${categoria}/zonas/${zona}/equipos`;
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // Limpiar datos al cambiar fase/categoría/zona/torneo
  useEffect(() => {
    setEquipos([]);
    setCruces([]);
    setResultados([]);
    setTablaPosiciones([]);
  }, [faseSel, categoriaSel, zonaSel, torneoSel]);

  // Cargar equipos
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!torneoSel || !faseSel || !categoriaSel || !zonaSel) return;
      try {
        const equiposCat = await obtenerEquiposCategoria(torneoSel, faseSel, categoriaSel, zonaSel);
        setEquipos(equiposCat);
      } catch (error) {
        toast.error('Error al cargar equipos');
        console.error(error);
      }
    };
    fetchEquipos();
  }, [torneoSel, faseSel, categoriaSel, zonaSel]);

  // Cargar torneos
  useEffect(() => {
    const fetchTorneos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "torneos"));
        const torneosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTorneos(torneosData);
      } catch (error) {
        console.error("Error al traer torneos:", error);
      }
    };
    fetchTorneos();
  }, []);

  // Cargar cruces
  useEffect(() => {
    const fetchCruces = async () => {
      if (!categoriaSel || !faseSel || !torneoSel || !zonaSel) return;

      try {
        const qCruces = query(
          collection(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`),
          where('categoria', '==', categoriaSel),
          where('fase', '==', faseSel),
          where('torneoId', '==', torneoSel),
          where('zona', '==', zonaSel)
        );
        const snapshot = await getDocs(qCruces);
        const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCruces(crucesData);

        // Inicializar fechas
        const fechas = {};
        crucesData.forEach(c => {
          fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
        });
        setFechasCruces(fechas);

      } catch (error) {
        console.error("Error al cargar cruces:", error);
      }
    };
    fetchCruces();
  }, [categoriaSel, faseSel, torneoSel, zonaSel]);

  // Cargar resultados filtrados por torneo, fase, categoria y zona
  useEffect(() => {
    const fetchResultados = async () => {
      if (!categoriaSel || !faseSel || !torneoSel || !zonaSel) return;
      try {
        const qRes = query(
          collection(db, 'resultados'),
          where('categoria', '==', categoriaSel),
          where('fase', '==', faseSel),
          where('torneoId', '==', torneoSel),
          where('zona', '==', zonaSel)
        );
        const snapshotRes = await getDocs(qRes);
        const resultadosData = snapshotRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResultados(resultadosData);
      } catch (error) {
        console.error('Error al obtener resultados:', error);
      }
    };
    fetchResultados();
  }, [categoriaSel, faseSel, torneoSel, zonaSel]);

  // Generar cruces
  const generarCruces = async () => {
    if (!torneoSel || !categoriaSel || !faseSel || !zonaSel) {
      toast.error('Seleccioná torneo, categoría, fase y zona primero');
      return;
    }
    if (equipos.length < 2) {
      toast.info('No hay suficientes equipos para generar cruces');
      return;
    }

    try {
      const torneoSeleccionado = torneos.find(t => t.id === torneoSel);
      if (!torneoSeleccionado) throw new Error('Torneo no encontrado');

      const refCruces = collection(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`);

      // Generar combinaciones de equipos
      const promesas = [];
      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          const cruce = {
            equipoA: equipos[i].nombre,
            equipoB: equipos[j].nombre,
            categoria: categoriaSel,
            fase: faseSel,
            torneoId: torneoSel,
            torneoNombre: torneoSeleccionado.nombre || torneoSeleccionado.id,
            zona: zonaSel,
            fechaHora: Timestamp.fromDate(new Date()) // fecha inicial
          };
          promesas.push(addDoc(refCruces, cruce));
        }
      }
      await Promise.all(promesas);

      // Recargar cruces
      const snapshot = await getDocs(refCruces);
      const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCruces(crucesData);

      // Inicializar fechas
      const fechas = {};
      crucesData.forEach(c => fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date());
      setFechasCruces(fechas);

      toast.success('Cruces generados correctamente', {
        theme: 'colored',
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });

    } catch (error) {
      console.error('Error al generar cruces:', error);
      toast.error('Error al generar cruces');
    }
  };

  // Actualizar fecha de un cruce
  const handleFechaChange = async (cruceId, date) => {
    setFechasCruces(prev => ({ ...prev, [cruceId]: date }));
    const refCruce = doc(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`, cruceId);
    await setDoc(refCruce, { fechaHora: Timestamp.fromDate(date) }, { merge: true });
  };

  // Eliminar colecciones globales (opcional)
const eliminarColecciones = async () => {
  try {
    // Traer todos los torneos, fases, categorías y zonas
    const torneosSnap = await getDocs(collection(db, "torneos"));
    const torneos = torneosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const fases = ["fase_de_grupos", "semifinales", "finales"];
    const categorias = ["U14", "U16", "U18", "Senior"];
    const zonas = ["a", "b", "c", "d"];

    // Borrar crucesGenerales de todas las rutas
    for (const torneo of torneos) {
      for (const fase of fases) {
        for (const categoria of categorias) {
          for (const zona of zonas) {
            const crucesRef = collection(db, `torneos/${torneo.id}/${fase}/${categoria}/zonas/${zona}/crucesGenerales`);
            const crucesSnap = await getDocs(crucesRef);
            const promesasCruces = crucesSnap.docs.map(d => deleteDoc(doc(crucesRef, d.id)));
            await Promise.all(promesasCruces);
          }
        }
      }
    }

    // Borrar resultados de la colección raíz (si los guardás ahí)
    const resultadosSnap = await getDocs(collection(db, "resultados"));
    const promesasResultados = resultadosSnap.docs.map(d => deleteDoc(doc(db, "resultados", d.id)));
    await Promise.all(promesasResultados);

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

  // Registrar resultado
  const handleResultado = async (local, visitante, ganador, marcador) => {
    setResultados(prev => {
      const indexExistente = prev.findIndex(
        r => (r.equipoA === local && r.equipoB === visitante) || (r.equipoA === visitante && r.equipoB === local)
      );
      if (indexExistente !== -1) {
        const nuevos = [...prev];
        nuevos[indexExistente] = { equipoA: local, equipoB: visitante, ganador, marcador, fase: faseSel, categoria: categoriaSel, torneoId: torneoSel, zona: zonaSel };
        return nuevos;
      }
      return [...prev, { equipoA: local, equipoB: visitante, ganador, marcador, fase: faseSel, categoria: categoriaSel, torneoId: torneoSel, zona: zonaSel }];
    });

    const torneoSeleccionado = torneos.find(t => t.id === torneoSel);
    const idResultado = `${local}_vs_${visitante}_${faseSel}_${categoriaSel}_${zonaSel}_${torneoSel}`;

    await setDoc(doc(db, 'resultados', idResultado), {
      equipoA: local,
      equipoB: visitante,
      ganador,
      marcador,
      fase: faseSel,
      categoria: categoriaSel,
      torneoId: torneoSel,
      torneoNombre: torneoSeleccionado?.nombre || "",
      zona: zonaSel
    });
  };

  // Manejar input de marcador
  const handleMarcadorChange = (id, value) => {
    const regex = /^\d{0,2}-?\d{0,2}$/;
    if (regex.test(value)) setMarcadores(prev => ({ ...prev, [id]: value }));
  };

  // Generar tabla de posiciones
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

    const tablaFinal = Object.values(equiposStats).sort((a, b) => {
      if (b.ganados !== a.ganados) return b.ganados - a.ganados;
      return b.diferencia - a.diferencia;
    });
    setTablaPosiciones(tablaFinal);
  };

  return (
    <>
    <div className="cruces-page">
      <Navbar />
      <div className="body">
        <div className="contenedor">
          <div className="contenedor-div">
            <button className="boton" onClick={generarCruces} disabled={equipos.length < 2}>Generar Cruces</button>
            <select value={categoriaSel} className='select-list' onChange={e => setCategoriaSel(e.target.value)}>
              <option value="">Seleccionar categoría</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="Senior">Senior</option>
            </select>
            <select value={faseSel} className='select-list' onChange={e => setFaseSel(e.target.value)}>
              <option value="">Seleccionar fase</option>
              <option value="fase_de_grupos">Fase de Grupos</option>
              <option value="semifinales">Semifinales</option>
              <option value="finales">Finales</option>
            </select>
            <select value={torneoSel} className='select-list' onChange={e => setTorneoSel(e.target.value)}>
              <option value="">Seleccionar torneo</option>
              {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre || t.id}</option>)}
            </select>
            <select value={zonaSel} className='select-list' onChange={e => setZonaSel(e.target.value)}>
              <option value="">Seleccionar zona</option>
              <option value="a">a</option>
              <option value="b">b</option>
              <option value="c">c</option>
              <option value="d">d</option>
            </select>
            <button className="boton" onClick={eliminarColecciones}>Limpiar cruces y ganadores</button>
          </div>
          <ul className="lista-cruces">
            {cruces.length === 0 ? (
              <li>No hay cruces generados</li>
            ) : (
              cruces.map(c => (
                <li key={c.id} className="card">
                  <p>{c.equipoA} vs {c.equipoB}</p>
                  <input
                    type="text"
                    placeholder="Ej: 21-10"
                    value={marcadores[c.id] || ""}
                    onChange={e => handleMarcadorChange(c.id, e.target.value)}
                  />
                  <button onClick={() => handleResultado(c.equipoA, c.equipoB, c.equipoA, marcadores[c.id] || "")}>Ganador: {c.equipoA}</button>
                  <button onClick={() => handleResultado(c.equipoA, c.equipoB, c.equipoB, marcadores[c.id] || "")}>Ganador: {c.equipoB}</button>
                  <DateTimePicker 
                    value={fechasCruces[c.id]} 
                    onChange={date => handleFechaChange(c.id, date)} 
                  />
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
          <h2>Tabla de posiciones de {faseSel} - Zona {zonaSel}</h2>
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
      </div>
    </>
  );
};

export default Cruces;