
import React, { useEffect, useState } from 'react';
import './cruces.css';
import './crearTorneo.css';
import Navbar from './Navbar';
import { collection, getDocs, addDoc, doc, setDoc, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DateTimePicker from './DateTimePicker';
  
const Cruces = ({ torneos: torneosProp, canchasTorneo }) => {
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
  const [fechasCruces, setFechasCruces] = useState({});
  const [canchasCruces, setCanchasCruces] = useState({});
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [intervaloMin, setIntervaloMin] = useState(15);
  const [todosCruces, setTodosCruces] = useState([]);
  const [numCanchas, setNumCanchas] = useState(canchasTorneo); // inicializar con prop


useEffect(() => {
  const fetchTodosCruces = async () => {
    if (!torneoSel) return; // Si no hay torneo seleccionado, no hacemos nada
    try {
      const fases = ["fase_de_grupos", "semifinales", "finales"];
      const categorias = ["U14", "U16", "U18", "Senior"];
      const zonas = ["a", "b", "c", "d"];
      const crucesAcumulados = [];

      for (const fase of fases) {
        for (const categoria of categorias) {
          for (const zona of zonas) {
            const snapshot = await getDocs(
              collection(db, `torneos/${torneoSel}/${fase}/${categoria}/zonas/${zona}/crucesGenerales`)
            );
            snapshot.docs.forEach(doc => {
              crucesAcumulados.push({ id: doc.id, ...doc.data() });
            });
          }
        }
      }

      setTodosCruces(crucesAcumulados);

      // Inicializar fechas y canchas
      const fechas = {};
      const canchas = {};
      crucesAcumulados.forEach(c => {
        fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
        canchas[c.id] = c.cancha || "";
      });
      setFechasCruces(fechas);
      setCanchasCruces(canchas);
      const torneoObj = torneos.find(t => t.id === torneoSel);
      setNumCanchas(torneoObj?.canchas || 0); // actualizar número de canchas según torneo

    } catch (error) {
      console.error("Error al traer todos los cruces:", error);
    }
  };

  fetchTodosCruces();

  // Opcional: actualizar cada vez que cambien los cruces en Firebase
  // puedes agregar un listener en lugar de solo getDocs para real-time
}, [torneoSel, cruces]); // <- Dependencias: actualiza cuando se cambien cruces o torneo seleccionado



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
    try {
      const equiposCat = await obtenerEquiposCategoria(torneoSel, faseSel, categoriaSel, zonaSel);
      setEquipos(equiposCat);

      if (torneoSel && faseSel && categoriaSel && zonaSel && equiposCat.length === 0) {
        toast.info('No hay suficientes equipos para generar cruces');
      }

    } catch (error) {
      toast.error('Error al cargar equipos');
      console.error(error);
    }
  };
  fetchEquipos();
}, [torneoSel, faseSel, categoriaSel, zonaSel]);

  // Cargar torneos
  useEffect(() => {
    if (torneosProp && torneosProp.length > 0) {
      setTorneos(torneosProp);
    } else {
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
    }
  }, [torneosProp]);

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

        // Inicializar fechas y canchas
        const fechas = {};
        const canchas = {};
        crucesData.forEach(c => {
          fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
          canchas[c.id] = c.cancha || "";
        });
        setFechasCruces(fechas);
        setCanchasCruces(canchas);

      } catch (error) {
        console.error("Error al cargar cruces:", error);
      }
    };
    fetchCruces();
  }, [categoriaSel, faseSel, torneoSel, zonaSel]);

  // Cargar resultados
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

  // Actualizar fechas de inicio/fin según torneo seleccionado
  useEffect(() => {
    if (!torneoSel || !torneos.length) {
      setFechaInicio('');
      setFechaFin('');
      return;
    }
    const torneoSeleccionado = torneos.find(t => t.id === torneoSel);
    setFechaInicio(torneoSeleccionado?.fechaInicio || '');
    setFechaFin(torneoSeleccionado?.fechaFin || '');
  }, [torneoSel, torneos]);

  // ==============================
  // GENERAR CRUCES AVANZADO
  // ==============================
  const generarCruces = async () => {
    if (!torneoSel || !categoriaSel || !faseSel || !zonaSel) {
    toast.error('Seleccioná torneo, categoría, fase y zona primero');
    return;
  }

  if (!equipos || equipos.length < 2) {
    console.log('Equipos disponibles:', equipos.length);
    toast.info('No hay suficientes equipos para generar cruces');
    return;
  }

    if (!fechaInicio || !fechaFin) {
      toast.error('Definí fecha de inicio y fin del torneo');
      return;
    }

    try {
      const torneoSeleccionado = torneos.find(t => t.id === torneoSel);
      if (!torneoSeleccionado) throw new Error('Torneo no encontrado');

      const refCruces = collection(
        db,
        `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`
      );

      // Usar fechas del torneo seleccionado
      const fechaInicioTorneo = torneoSeleccionado.fechaInicio ? new Date(torneoSeleccionado.fechaInicio) : new Date(fechaInicio);
      const fechaFinTorneo = torneoSeleccionado.fechaFin ? new Date(torneoSeleccionado.fechaFin) : new Date(fechaFin);
      const canchasDisponibles = [
        "cancha1","cancha2","cancha3","cancha4",
        "cancha5","cancha6","cancha7","cancha8"
      ];

      const slots = [];
      let fechaActual = new Date(fechaInicioTorneo);
      while (fechaActual <= fechaFinTorneo) {
        slots.push(new Date(fechaActual));
        fechaActual = new Date(fechaActual.getTime() + intervaloMin * 60 * 1000);
      }
      if (slots.length === 0) throw new Error('No hay horarios disponibles en el rango elegido');

      const ocupacion = {};
      const promesas = [];
      let slotIndex = 0;

      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          let cruceAsignado = false;
          while (!cruceAsignado && slotIndex < slots.length) {
            const fechaCruce = slots[slotIndex];
            const fechaKey = fechaCruce.toISOString();
            if (!ocupacion[fechaKey]) ocupacion[fechaKey] = [];

            const canchaLibre = canchasDisponibles.find(c => !ocupacion[fechaKey].includes(c));
            if (canchaLibre) {
              ocupacion[fechaKey].push(canchaLibre);

              const cruce = {
                equipoA: equipos[i].nombre,
                equipoB: equipos[j].nombre,
                categoria: categoriaSel,
                fase: faseSel,
                torneoId: torneoSel,
                torneoNombre: torneoSeleccionado.nombre || torneoSeleccionado.id,
                zona: zonaSel,
                fechaHora: Timestamp.fromDate(fechaCruce),
                cancha: canchaLibre,
              };
              promesas.push(addDoc(refCruces, cruce));
              cruceAsignado = true;
            } else slotIndex++;
          }

          if (!cruceAsignado) {
            toast.warn('No hay suficientes horarios o canchas para todos los cruces');
            break;
          }
        }
      }

      await Promise.all(promesas);

      const snapshot = await getDocs(refCruces);
      const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCruces(crucesData);

      const fechas = {};
      const canchas = {};
      crucesData.forEach(c => {
        fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
        canchas[c.id] = c.cancha || "";
      });
      setFechasCruces(fechas);
      setCanchasCruces(canchas);

      toast.success('Cruces generados sin superposición de canchas ✅', {
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

  const handleCanchaChange = async (cruceId, value) => {
    setCanchasCruces(prev => ({ ...prev, [cruceId]: value }));
    const refCruce = doc(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`, cruceId);
    await setDoc(refCruce, { cancha: value }, { merge: true });
  };

  // Eliminar colecciones
  const eliminarColecciones = async () => {
    toast.success('Eliminando cruces, espere...', {
        theme: 'colored',
        transition: Bounce,
        style: { backgroundColor: '#800080', color: '#fff' }
      });
    try {
      const torneosSnap = await getDocs(collection(db, "torneos"));
      const torneosData = torneosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fases = ["fase_de_grupos", "semifinales", "finales"];
      const categorias = ["U14", "U16", "U18", "Senior"];
      const zonas = ["a", "b", "c", "d"];

      for (const torneo of torneosData) {
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

  const handleMarcadorChange = (id, value) => {
    const regex = /^\d{0,2}-?\d{0,2}$/;
    if (regex.test(value)) setMarcadores(prev => ({ ...prev, [id]: value }));
  };

const generarTablaPosiciones = () => {
  if (resultados.length === 0 || equipos.length === 0) return;

  const equiposStats = {};

  // Inicializar estadísticas de todos los equipos
  equipos.forEach(e => {
    equiposStats[e.nombre] = {
      nombre: e.nombre,
      ganados: 0,
      perdidos: 0,
      partidosJugados: 0,
      puntosAFavor: 0,
      puntosEnContra: 0,
      diferencia: 0
    };
  });

  // Calcular estadísticas según resultados
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

    eqA.partidosJugados += 1;
    eqB.partidosJugados += 1;

    if (r.ganador === r.equipoA) {
      eqA.ganados += 1;
      eqB.perdidos += 1;
    } else if (r.ganador === r.equipoB) {
      eqB.ganados += 1;
      eqA.perdidos += 1;
    }
  });

  // Ordenar tabla: primero por ganados, luego por diferencia, luego por puntos a favor
  const tablaFinal = Object.values(equiposStats).sort((a, b) => {
    if (b.ganados !== a.ganados) return b.ganados - a.ganados;
    if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
    return b.puntosAFavor - a.puntosAFavor;
  });

  setTablaPosiciones(tablaFinal);
};


  return (
    <>
      <div className="cruces-page">
        <Navbar />
        <div className="body-cruces">
          <div className="contenedor">
            <div className="contenedor-div">
              <button className="boton" onClick={generarCruces} disabled={equipos.length < 2}>Generar Cruces</button>
              <select value={categoriaSel} className='select-list' onChange={e => setCategoriaSel(e.target.value)}>
                <option value="">Categoría</option>
                <option value="U14">U14</option>
                <option value="U16">U16</option>
                <option value="U18">U18</option>
                <option value="Senior">Senior</option>
              </select>
              <select value={faseSel} className='select-list' onChange={e => setFaseSel(e.target.value)}>
                <option value="">Fase</option>
                <option value="fase_de_grupos">Fase de Grupos</option>
                <option value="semifinales">Semifinales</option>
                <option value="finales">Finales</option>
              </select>
              <select value={torneoSel} className='select-list' onChange={e => setTorneoSel(e.target.value)}>
                <option value="">Torneo</option>
                {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre || t.id}</option>)}
              </select>
              <select value={zonaSel} className='select-list' onChange={e => setZonaSel(e.target.value)}>
                <option value="">Zona</option>
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
                  <li key={c.id} className="card cruce">
                    <p>{c.equipoA} <br />vs <br /> {c.equipoB}</p>
                    <p>
          Horario: {fechasCruces[c.id] ? fechasCruces[c.id].toLocaleString() : "Sin horario"}
        </p>
                    <input
                      className='input-marcador'
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
                    <select
                      value={canchasCruces[c.id] || ""}
                      className='select-list cancha'
                      onChange={e => handleCanchaChange(c.id, e.target.value)}
                    >
                      <option value="">Cancha</option>
                      {[...Array(numCanchas)].map((_, i) => (
                        <option key={i} value={`cancha${i+1}`}>Cancha {i+1}</option>
                      ))}
                    </select>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="resultados">
  <h2>Partidos jugados y por jugar</h2>
  {todosCruces.length === 0 ? (
    <p>No hay cruces generados</p>
  ) : (
    <div className="grid-canchas">
      {[...Array(numCanchas)].map((_, i) => {
        const cancha = `cancha${i + 1}`;
        const partidosEnCancha = todosCruces.filter(
          c => (canchasCruces[c.id] || "") === cancha
        );

        return (
          <div key={cancha} className="columna-cancha">
            <h3>🏟️ Cancha {i + 1}</h3>
            {partidosEnCancha.length > 0 ? (
              <ul className="lista-partidos-cancha">
                {partidosEnCancha
                  .sort((a, b) => {
                    const fechaA = fechasCruces[a.id]?.getTime() || Infinity;
                    const fechaB = fechasCruces[b.id]?.getTime() || Infinity;
                    return fechaA - fechaB;
                  })
                  .map(c => (
                    <li key={c.id} className="li-partido">
                      {c.equipoA} vs {c.equipoB} <br />
                      <span className="detalle-partido">
                        {fechasCruces[c.id]
                          ? fechasCruces[c.id].toLocaleString()
                          : "Sin fecha"}{" "}
                        - {c.categoria} - {c.fase} - Zona {c.zona}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="sin-partidos">Sin partidos</p>
            )}
          </div>
        );
      })}
    </div>
  )}
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