import React, { useEffect, useState } from 'react'
import './cruces.css'
import Navbar from './Navbar'
import { collection, getDocs } from 'firebase/firestore'
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

    fetchEquipos()
    const crucesGuardados = JSON.parse(localStorage.getItem("CrucesPrincipales"))
    const resultadosGuardados = JSON.parse(localStorage.getItem("Resultados"))
    const crucesPerdedoresGuardados = JSON.parse(localStorage.getItem("CrucesPerdedores"))
    const crucesGanadoresGuardados = JSON.parse(localStorage.getItem("CrucesGanadores"))
    console.log("Resultados guardados en localStorage:", resultadosGuardados)
    console.log("Cruces guardados en localStorage:", crucesGuardados)
    console.log("Cruces perdedores guardados en localStorage:", crucesPerdedoresGuardados)
    console.log("Cruces ganadores guardados en localStorage:", crucesGanadoresGuardados)
    if (crucesGuardados && resultadosGuardados && crucesPerdedoresGuardados && crucesGanadoresGuardados) {
      setCruces(crucesGuardados)
      setResultados(resultadosGuardados)
      setCrucesPerdedores(crucesPerdedoresGuardados)
      setCrucesGanadores(crucesGanadoresGuardados)
    }
  }, [])

  const generarCruces = (equipos) => {
    let crucesGenerados = []
    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        crucesGenerados.push({
          equipoA: equipos[i].nombre,
          equipoB: equipos[j].nombre
        })
      }
    }
    setCruces(crucesGenerados)
    localStorage.setItem("CrucesPrincipales", JSON.stringify(crucesGenerados))
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
    });
  }

  const handleResultado = (equipoA, equipoB, ganador) => {
    // Evitar duplicados: si ya hay un resultado para ese cruce, reemplazarlo
    setResultados((prevResultados) => {
      const indexExistente = prevResultados.findIndex(
        r => (r.equipoA === equipoA && r.equipoB === equipoB) || (r.equipoA === equipoB && r.equipoB === equipoA)
      )
      if (indexExistente !== -1) {
        // reemplaza el resultado
        const nuevosResultados = [...prevResultados]
        nuevosResultados[indexExistente] = { equipoA, equipoB, ganador }
        return nuevosResultados
      }
      return [...prevResultados, { equipoA, equipoB, ganador }]
    })
    localStorage.setItem("Resultados", JSON.stringify([...resultados, { equipoA, equipoB, ganador }]))
  }

  const handlerCrucesperdedores = () => {
    const perdedoresUnicos = [...new Set(resultados.map(r => r.equipoA === r.ganador ? r.equipoB : r.equipoA))]
    setPerdedores(perdedoresUnicos)
    const cruces = []
    for (let i=0; i < perdedoresUnicos.length; i++) {
      for(let j = i + 1; j < perdedoresUnicos.length; j++) {
        cruces.push({
          equipoA: perdedoresUnicos[i],
          equipoB: perdedoresUnicos[j]
        })
      }
    }
    localStorage.setItem("CrucesPerdedores", JSON.stringify(cruces))
    setCrucesPerdedores(cruces)
    toast.success('Cruces entre perdedores generados correctamente', {
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
  }
  const handlerCrucesGanadores = () => {
      const ganadoresUnicos = [...new Set(resultados.map(r => r.ganador))]
      setGanadores(ganadoresUnicos)
    const cruces = []
  for (let i = 0; i < ganadoresUnicos.length; i++) {
    for (let j = i + 1; j < ganadoresUnicos.length; j++) {
      cruces.push({
        equipoA: ganadoresUnicos[i],
        equipoB: ganadoresUnicos[j]
      })
    }
  }
  setCrucesGanadores(cruces)
  localStorage.setItem("CrucesGanadores", JSON.stringify(cruces))
  toast.success('Cruces entre ganadores generados correctamente', {
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
}

    return (
    <>
      <Navbar />
      <div className="body">
        <div className="contenedor">
          <button className="boton" onClick={() => generarCruces(equipos)}>
            Generar Cruces
          </button>

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
        <div className="crucesGanadores">
          <h2>Cruces Ganadores</h2>
          <button className="botonGanadores boton" onClick={handlerCrucesGanadores}>
            Obtener Ganadores
          </button>
          {crucesGanadores.length === 0 ? (
  <p>No hay cruces entre ganadores aún</p>
) : (
  crucesGanadores.map((cruce, index) => (
    <h3 key={index}>
      {cruce.equipoA} vs {cruce.equipoB}
    </h3>
  ))
)}
        </div>
        <div className="crucesPerdedores">
          <h2>Cruces Perdedores</h2>
          <button className="botonGanadores boton" onClick={handlerCrucesperdedores}>
            Obtener Ganadores
          </button>
          {crucesPerdedores.length === 0 ? (
  <p>No hay cruces entre perdedores aún</p>
) : (
  crucesPerdedores.map((cruce, index) => (
    <h3 key={index} className="crucePerdedor">
      {cruce.equipoA} vs {cruce.equipoB}
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
