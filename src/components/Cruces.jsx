import React, { useEffect, useState } from 'react';
import './cruces.css';
import './crearTorneo.css';
import Navbar from './Navbar';
import { collection, getDocs, addDoc, doc, setDoc, Timestamp, deleteDoc, collectionGroup} from 'firebase/firestore';
import { db } from '../firebarseConfig.js';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DateTimePicker from './DateTimePicker';

const Cruces = ({ torneos: torneosProp, canchasTorneo, numZonas }) => {
  const [torneos, setTorneos] = useState([]);
  const [torneoSel, setTorneoSel] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [faseSel, setFaseSel] = useState('');
  const [zonaSel, setZonaSel] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [cruces, setCruces] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [marcadores, setMarcadores] = useState({});
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [fechasCruces, setFechasCruces] = useState({});
  const [canchasCruces, setCanchasCruces] = useState({});
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [intervaloMin, setIntervaloMin] = useState(15);
  const [todosCruces, setTodosCruces] = useState([]);
  const [numCanchas, setNumCanchas] = useState(canchasTorneo || 1);

  // ========================
  // GENERAR ZONAS
  // ========================
  const generarZonas = (num) => [...Array(num)].map((_, i) => `zona${i + 1}`);
  const numZonasTorneoSel = torneoSel
    ? torneos.find(t => t.id === torneoSel)?.zonas || 1
    : 1;
  const zonas = generarZonas(numZonasTorneoSel);

// ========================
// CARGAR RESULTADOS
// ========================
useEffect(() => {
  const fetchResultados = async () => {
    if (!torneoSel || !categoriaSel || !faseSel || !zonaSel) return;

    try {
      const resultadosSnap = await getDocs(collection(db, "resultados"));
      const resultadosFiltrados = resultadosSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r =>
          r.torneoId === torneoSel &&
          r.categoria === categoriaSel &&
          r.fase === faseSel &&
          r.zona === zonaSel
        );
      setResultados(resultadosFiltrados);
    } catch (error) {
      console.error("Error al cargar resultados:", error);
      toast.error("Error al cargar resultados");
    }
  };

  fetchResultados();
}, [torneoSel, categoriaSel, faseSel, zonaSel]);

useEffect(() => {
  generarTablaPosiciones();
}, [resultados, equipos]);


  // ========================
  // CARGAR TORNEOS
  // ========================
  useEffect(() => {
    if (torneosProp?.length) {
      setTorneos(torneosProp);
    } else {
      const fetchTorneos = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'torneos'));
          const torneosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTorneos(torneosData);
        } catch (error) {
          console.error('Error al traer torneos:', error);
        }
      };
      fetchTorneos();
    }
  }, [torneosProp]);

  // ========================
  // LIMPIAR DATOS AL CAMBIAR SELECCIONES
  // ========================
  useEffect(() => {
    setEquipos([]);
    setCruces([]);
    setResultados([]);
    setTablaPosiciones([]);
    setFechasCruces({});
    setCanchasCruces({});
  }, [torneoSel, categoriaSel, faseSel, zonaSel]);

  // ========================
  // CARGAR EQUIPOS
  // ========================
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!torneoSel || !faseSel || !categoriaSel || !zonaSel) return;
      try {
        const snapshot = await getDocs(collection(db, `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/equipos`));
        const equiposData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipos(equiposData);

        if (equiposData.length < 2) {
          toast.info('No hay suficientes equipos para generar cruces');
        }
      } catch (error) {
        toast.error('Error al cargar equipos');
        console.error(error);
      }
    };
    fetchEquipos();
  }, [torneoSel, faseSel, categoriaSel, zonaSel]);

  // ========================
// CARGAR CRUCES AUTOMÁTICAMENTE SEGÚN SELECCIONES
// ========================
useEffect(() => {
  const fetchCrucesSeleccionados = async () => {
    if (!torneoSel || !categoriaSel || !faseSel || !zonaSel) {
      setCruces([]);
      return;
    }

    try {
      const refCruces = collection(
        db,
        `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`
      );
      const snapshot = await getDocs(refCruces);
      const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCruces(crucesData);

      // Cargar fechas y canchas
      const fechas = {};
      const canchas = {};
      crucesData.forEach(c => {
        fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
        canchas[c.id] = c.cancha || "";
      });
      setFechasCruces(fechas);
      setCanchasCruces(canchas);
    } catch (error) {
      console.error('Error al cargar cruces:', error);
      toast.error('Error al cargar cruces automáticamente');
    }
  };

  fetchCrucesSeleccionados();
}, [torneoSel, categoriaSel, faseSel, zonaSel]);

  // ========================
  // CARGAR CRUCES DE FIRESTORE
  // ========================
  useEffect(() => {
    const fetchCruces = async () => {
      if (!torneoSel) return;

      try {
        const crucesAcumulados = [];
        const torneoObj = torneos.find(t => t.id === torneoSel);
        const numCanchasTorneo = torneoObj?.canchas || numCanchas;
        const fases = ["fase_de_grupos", "semifinales", "finales"];
        const categorias = ["U14", "U16", "U18", "Senior"];
        const zonasReales = generarZonas(torneoObj?.zonas || 1);

        for (const fase of fases) {
          for (const categoria of categorias) {
            for (const zona of zonasReales) {
              const snapshot = await getDocs(
                collection(db, `torneos/${torneoSel}/${fase}/${categoria}/zonas/${zona}/crucesGenerales`)
              );
              snapshot.docs.forEach(doc => crucesAcumulados.push({ id: doc.id, ...doc.data() }));
            }
          }
        }

        setTodosCruces(crucesAcumulados);

        // Inicializar fechas y canchas
        const fechas = {};
        const canchas = {};
        crucesAcumulados.forEach(c => {
          fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
          canchas[c.id] = c.cancha || '';
        });
        setFechasCruces(fechas);
        setCanchasCruces(canchas);

      } catch (error) {
        console.error('Error al traer cruces:', error);
      }
    };

    fetchCruces();
  }, [torneoSel, torneos]);

  // ========================
  // GENERAR CRUCES
  // ========================
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

    const refCruces = collection(
      db,
      `torneos/${torneoSel}/${faseSel}/${categoriaSel}/zonas/${zonaSel}/crucesGenerales`
    );
    // 🔹 Verificar si ya existen cruces en esta ruta
    const crucesExistentes = await getDocs(refCruces);
    if (!crucesExistentes.empty) {
      toast.info("Ya hay cruces generados para esta zona. No se generarán nuevos.", {
        theme: "colored",
        transition: Bounce,
        style: { backgroundColor: "#800080", color: "#fff" }
      });

      // Cargar los existentes para mostrarlos (por si no están en el estado)
      const crucesData = crucesExistentes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCruces(crucesData);

      const fechas = {};
      const canchas = {};
      crucesData.forEach(c => {
        fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
        canchas[c.id] = c.cancha || '';
      });
      setFechasCruces(fechas);
      setCanchasCruces(canchas);

      return; // 👈 detener la función aquí
    }

    const canchasDisponibles = Array.from({ length: numCanchas }, (_, i) => `cancha${i + 1}`);

    const fechaInicioTorneo = torneoSeleccionado.fechaInicio
      ? new Date(torneoSeleccionado.fechaInicio)
      : new Date();
    const fechaFinTorneo = torneoSeleccionado.fechaFin
      ? new Date(torneoSeleccionado.fechaFin)
      : new Date(fechaInicioTorneo.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Generar slots de tiempo
    const slots = [];
    let fechaActual = new Date(fechaInicioTorneo);
    while (fechaActual <= fechaFinTorneo) {
      slots.push(new Date(fechaActual));
      fechaActual = new Date(fechaActual.getTime() + intervaloMin * 60 * 1000);
    }
    if (!slots.length) throw new Error('No hay horarios disponibles');

    // Obtener todos los cruces del torneo (sin importar categoría ni zona)
    const refCrucesGlobal = collectionGroup(db, 'crucesGenerales');
    const snapshotExistentes = await getDocs(refCrucesGlobal);

    const ocupacion = {};
    canchasDisponibles.forEach(c => (ocupacion[c] = []));
    snapshotExistentes.docs.forEach(doc => {
      const c = doc.data();
      if (c.torneoId === torneoSel && c.cancha) {
        const fecha = c.fechaHora?.toDate ? c.fechaHora.toDate() : new Date();
        ocupacion[c.cancha].push(fecha);
      }
    });

    // Trackear partidos por equipo
    const partidosPorEquipo = {};
    equipos.forEach(e => partidosPorEquipo[e.nombre] = []);

    const margenMinutos = 15;

    // Generar cruces nuevos
    const promesas = [];
    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        let cruceAsignado = false;

        for (let slot of slots) {
          if (cruceAsignado) break;

          for (let cancha of canchasDisponibles) {
            const canchaOcupada = ocupacion[cancha].some(
              f => Math.abs(f.getTime() - slot.getTime()) < margenMinutos * 60 * 1000
            );
            const equipoAocupado = partidosPorEquipo[equipos[i].nombre].some(
              f => Math.abs(f.getTime() - slot.getTime()) < margenMinutos * 60 * 1000
            );
            const equipoBocupado = partidosPorEquipo[equipos[j].nombre].some(
              f => Math.abs(f.getTime() - slot.getTime()) < margenMinutos * 60 * 1000
            );

            if (!canchaOcupada && !equipoAocupado && !equipoBocupado) {
              ocupacion[cancha].push(slot);
              partidosPorEquipo[equipos[i].nombre].push(slot);
              partidosPorEquipo[equipos[j].nombre].push(slot);

              promesas.push(
                addDoc(refCruces, {
                  equipoA: equipos[i].nombre,
                  equipoB: equipos[j].nombre,
                  categoria: categoriaSel,
                  fase: faseSel,
                  torneoId: torneoSel,
                  torneoNombre: torneoSeleccionado.nombre || torneoSeleccionado.id,
                  zona: zonaSel,
                  fechaHora: Timestamp.fromDate(slot),
                  cancha
                })
              );

              cruceAsignado = true;
              break;
            }
          }
        }

        if (!cruceAsignado) {
          toast.warn(
            `No se pudo asignar horario a ${equipos[i].nombre} vs ${equipos[j].nombre}, revisá slots y canchas`
          );
        }
      }
    }

    await Promise.all(promesas);

    toast.success('Cruces generados correctamente ✅', {
      theme: 'colored',
      transition: Bounce,
      style: { backgroundColor: '#800080', color: '#fff' }
    });

    // Recargar cruces
    const snapshot = await getDocs(refCruces);
    const crucesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCruces(crucesData);

    // Actualizar fechas y canchas
    const fechas = {};
    const canchas = {};
    crucesData.forEach(c => {
      fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
      canchas[c.id] = c.cancha || '';
    });
    setFechasCruces(fechas);
    setCanchasCruces(canchas);
  } catch (error) {
    console.error('Error al generar cruces:', error);
    toast.error('Error al generar cruces');
  }
};



  // ========================
  // FUNCIONES DE RESULTADOS Y TABLA
  // ========================
  const handleResultado = async (local, visitante, ganador, marcador) => {
    const idResultado = `${local}_vs_${visitante}_${faseSel}_${categoriaSel}_${zonaSel}_${torneoSel}`;
    const torneoSeleccionado = torneos.find(t => t.id === torneoSel);

    const nuevoResultado = {
      equipoA: local,
      equipoB: visitante,
      ganador,
      marcador,
      fase: faseSel,
      categoria: categoriaSel,
      torneoId: torneoSel,
      torneoNombre: torneoSeleccionado?.nombre || "",
      zona: zonaSel
    };

    setResultados(prev => {
      const indexExistente = prev.findIndex(r => r.id === idResultado);
      if (indexExistente !== -1) {
        const nuevos = [...prev];
        nuevos[indexExistente] = { id: idResultado, ...nuevoResultado };
        return nuevos;
      }
      return [...prev, { id: idResultado, ...nuevoResultado }];
    });

    await setDoc(doc(db, 'resultados', idResultado), nuevoResultado);
  };

  const handleMarcadorChange = (id, value) => {
    const regex = /^\d{0,2}-?\d{0,2}$/;
    if (regex.test(value)) setMarcadores(prev => ({ ...prev, [id]: value }));
  };

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

  const generarTablaPosiciones = () => {
    if (!resultados.length || !equipos.length) return;

    const stats = {};
    equipos.forEach(e => stats[e.nombre] = { nombre: e.nombre, ganados: 0, perdidos: 0, partidosJugados: 0, puntosAFavor: 0, puntosEnContra: 0, diferencia: 0 });

    resultados.forEach(r => {
      if (!r.marcador) return;
      const [gA, gB] = r.marcador.split('-').map(n => parseInt(n, 10));
      if (isNaN(gA) || isNaN(gB)) return;

      stats[r.equipoA].partidosJugados++;
      stats[r.equipoB].partidosJugados++;
      stats[r.equipoA].puntosAFavor += gA;
      stats[r.equipoA].puntosEnContra += gB;
      stats[r.equipoB].puntosAFavor += gB;
      stats[r.equipoB].puntosEnContra += gA;
      stats[r.equipoA].diferencia = stats[r.equipoA].puntosAFavor - stats[r.equipoA].puntosEnContra;
      stats[r.equipoB].diferencia = stats[r.equipoB].puntosAFavor - stats[r.equipoB].puntosEnContra;

      if (r.ganador === r.equipoA) stats[r.equipoA].ganados++, stats[r.equipoB].perdidos++;
      else if (r.ganador === r.equipoB) stats[r.equipoB].ganados++, stats[r.equipoA].perdidos++;
    });

    const tabla = Object.values(stats).sort((a, b) => b.ganados - a.ganados || b.diferencia - a.diferencia || b.puntosAFavor - a.puntosAFavor);
    setTablaPosiciones(tabla);
  };

  // ========================
  // ELIMINAR CRUCES Y RESULTADOS
  // ========================
  const eliminarColecciones = async () => {
    toast.success('Eliminando cruces, espere...', { theme: 'colored', transition: Bounce, style: { backgroundColor: '#800080', color: '#fff' } });

    try {
      const torneosSnap = await getDocs(collection(db, "torneos"));
      const torneosData = torneosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fases = ["fase_de_grupos", "semifinales", "finales"];
      const categorias = ["U14", "U16", "U18", "Senior"];

      for (const torneo of torneosData) {
        const zonasDelTorneo = torneo.zonas || 1;
        for (const fase of fases) {
          for (const categoria of categorias) {
            for (const zona of generarZonas(zonasDelTorneo)) {
              const crucesSnap = await getDocs(collection(db, `torneos/${torneo.id}/${fase}/${categoria}/zonas/${zona}/crucesGenerales`));
              for (const d of crucesSnap.docs) {
                await deleteDoc(doc(db, `torneos/${torneo.id}/${fase}/${categoria}/zonas/${zona}/crucesGenerales/${d.id}`));
              }
            }
          }
        }
      }

      const resultadosSnap = await getDocs(collection(db, "resultados"));
      for (const d of resultadosSnap.docs) {
        await deleteDoc(doc(db, "resultados", d.id));
      }

      setCruces([]);
      setTodosCruces([]);
      setResultados([]);
      setFechasCruces({});
      setCanchasCruces({});

      toast.success('Colecciones eliminadas ✅', { theme: 'colored', transition: Bounce, style: { backgroundColor: '#800080', color: '#fff' } });
    } catch (error) {
      console.error('Error al eliminar colecciones:', error);
      toast.error('Error al eliminar colecciones');
    }
  };

  // ========================
  // FETCH TODOS CRUCES (zonas reales)
  // ========================
  useEffect(() => {
    const fetchTodosCruces = async () => {
      if (!torneoSel) return;
      try {
        const fases = ["fase_de_grupos", "semifinales", "finales"];
        const categorias = ["U14", "U16", "U18", "Senior"];
        const torneoObj = torneos.find(t => t.id === torneoSel);
        const zonasReales = generarZonas(torneoObj?.zonas || 1);
        const crucesAcumulados = [];

        for (const fase of fases) {
          for (const categoria of categorias) {
            for (const zona of zonasReales) {
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

        const fechas = {};
        const canchas = {};
        crucesAcumulados.forEach(c => {
          fechas[c.id] = c.fechaHora ? c.fechaHora.toDate() : new Date();
          canchas[c.id] = c.cancha || "";
        });
        setFechasCruces(fechas);
        setCanchasCruces(canchas);
        setNumCanchas(torneoObj?.canchas || 1);

      } catch (error) {
        console.error("Error al traer todos los cruces:", error);
      }
    };

    fetchTodosCruces();
  }, [torneoSel, torneos, cruces]);

  // ========================
  // RENDER
  // ========================
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
                {zonas.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
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

                  const crucesParaVista = todosCruces
                    .map(c => ({
                      ...c,
                      fechaHora: fechasCruces[c.id] || (c.fechaHora?.toDate ? c.fechaHora.toDate() : new Date()),
                      cancha: canchasCruces[c.id] || c.cancha || ""
                    }))
                    .filter(c => c.cancha === cancha);

                  crucesParaVista.sort((a, b) => a.fechaHora - b.fechaHora);

                  return (
                    <div key={cancha} className="columna-cancha">
                      <h3>🏟️ Cancha {i + 1}</h3>
                      {crucesParaVista.length > 0 ? (
                        <ul className="lista-partidos-cancha">
                          {crucesParaVista.map(c => (
                            <li key={c.id} className="li-partido">
                              {c.equipoA} vs {c.equipoB} <br />
                              <span className="detalle-partido">
                                {c.fechaHora ? c.fechaHora.toLocaleString() : "Sin fecha"} -{" "}
                                <strong>categoria: {c.categoria}</strong>, fase: {c.fase}, zona: {c.zona}
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
