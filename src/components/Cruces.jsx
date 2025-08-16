import React, { useEffect, useState } from 'react'
import './cruces.css'
import Navbar from './Navbar'
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebarseConfig.js'
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const Cruces = () => {
  const [equipos, setEquipos] = useState([])
  const [cruces, setCruces] = useState([])
  const [resultados, setResultados] = useState([])
  const [ganadores, setGanadores] = useState([])
  const [crucesGanadores, setCrucesGanadores] = useState([])
  const [perdedores, setPerdedores] = useState([])
  const [crucesPerdedores, setCrucesPerdedores] = useState([])


  useEffect(() => {
    const fetchCrucesGanadores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'crucesGanadores'))
        const crucesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setCrucesGanadores(crucesData)
      } catch (error) {
        console.error('Error al obtener los cruces ganadores:', error)
      }
    }
  const fetchResultados = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'resultados'))
      const resultadosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setResultados(resultadosData)
    } catch (error) {
      console.error('Error al obtener los resultados:', error)
    }
  }

  const fetchEquipos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'equipos'))
      const equiposData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setEquipos(equiposData)
    } catch (error) {
      console.error('Error al obtener los equipos:', error)
    }
  }

  const fetchCruces = async () => {
    try {
      const crucesSnapshot = await getDocs(collection(db, "crucesGenerales"));
      const crucesData = crucesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCruces(crucesData);
    } catch (error) {
      console.error("Error al obtener los cruces:", error);
    }
  }

  fetchEquipos();
  fetchCruces();
  fetchResultados();
  fetchCrucesGanadores();
}, []);

  const eliminarColecciones = async () => {
  try {
    const colecciones = ['crucesGenerales', 'crucesGanadores', 'resultados', 'equipos', 'jugadores'];
    
    for (const nombre of colecciones) {
      const ref = collection(db, nombre);
      const snapshot = await getDocs(ref);

      // 👇 Borramos cada documento de la colección
      const promesas = snapshot.docs.map((d) => 
        deleteDoc(doc(db, nombre, d.id))
      );

      await Promise.all(promesas);
    }

    console.log("Colecciones vaciadas correctamente ✅");
  } catch (error) {
    console.error("Error al eliminar colecciones:", error);
  }
};

  
  const generarCruces = async (equipos) => {
    try {
      const crucesRef = collection(db, "crucesGenerales");
      const snapshot = await getDocs(crucesRef);

          toast.success('Cruces ya generados', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
      style: {
        backgroundColor: '#800080', // morado oscuro
        color: '#fff'
      }
      });
        let crucesGenerados = []
    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        crucesGenerados.push({
          equipoA: equipos[i].nombre,
          equipoB: equipos[j].nombre
        })
      }
    }
    for (const cruce of crucesGenerados) {
      await addDoc(crucesRef, cruce);
    } 
    setCruces(crucesGenerados)
    toast.success('Cruces generados correctamente', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
      style: {
        backgroundColor: '#800080', // morado oscuro
        color: '#fff'
      }
    })
  } catch (error) {
        console.error("Error al guardar el cruce:", error);
      }
    }

  const handleResultado = async (local, visitante, ganador) => {
  try {
    setResultados((prevResultados) => {
      const indexExistente = prevResultados.findIndex(
        r => (r.equipoA === local && r.equipoB === visitante) || (r.equipoA === visitante && r.equipoB === local)
      )
      if (indexExistente !== -1) {
        const nuevosResultados = [...prevResultados]
        nuevosResultados[indexExistente] = { equipoA: local, equipoB: visitante, ganador }
        return nuevosResultados
      }
      return [...prevResultados, { equipoA: local, equipoB: visitante, ganador }]
    })

    // 🔥 en Firestore guardamos con un ID único
    const idResultado = `${local}_vs_${visitante}`
    await setDoc(doc(db, "resultados", idResultado), {
      equipoA: local,
      equipoB: visitante,
      ganador,
    })
  } catch (error) {
    console.error("Error al guardar el resultado:", error);
  }
}


    return (
    <>
      <Navbar />
      <div className="body">
        <div className="contenedor">
          <div className="contenedor-div">
          <button className="boton" onClick={() => generarCruces(equipos)}>
            Generar Cruces
          </button>
          <button className="boton" onClick={() => eliminarColecciones()}>
            Limpiar cruces y ganadores
          </button>
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
            resultados.map((resultado, index) => (
              <h3 key={index}>
                {resultado.equipoA} vs {resultado.equipoB} - Ganador: <strong>{resultado.ganador}</strong>
              </h3>
            ))
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default Cruces
