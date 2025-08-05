import React from 'react'
import Navbar from "./Navbar";
import './home.css';
import './equipos.css';
import './cruces.css';
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebarseConfig.js'
import { useEffect, useState } from 'react'


const Equipos = () => {
    const [equipos, setEquipos] = useState([])
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
      }, [])
    
  return (
    <>
        <Navbar />
        <div className="body">
        <div className="listaEquipos">
            <h1 className='equipos'>Equipos Participantes</h1>
            <div className="contenedorEquipos">
                {equipos.map((equipo) => (
                    <div className="cardEquipo" key={equipo.id}>
                        <h2>{equipo.nombre}</h2>
                    </div>
                ))}
            </div>
        </div>
        </div>
    </>
  )
}

export default Equipos