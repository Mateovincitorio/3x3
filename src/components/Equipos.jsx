import React from 'react'
import Navbar from "./Navbar";
import './home.css';
import './equipos.css';
import './cruces.css';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebarseConfig.js'
import { useEffect, useState } from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


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

  const handleDelete = async (id, e) => {
  e.preventDefault();
  try {
    await deleteDoc(doc(db, "equipos", id));
    setEquipos((prevEquipos) => prevEquipos.filter((equipo) => equipo.id !== id));
    console.log("Documento eliminado con ID: ", id);
    toast.success('Equipo eliminado correctamente', {
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
  } catch (error) {
    console.error("Error eliminando documento: ", error);
  }
};

    
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
                        <button className="boton" onClick={(e) => handleDelete(equipo.id, e)}>Eliminar</button>
                    </div>
                ))}
            </div>
        </div>
        </div>
        <ToastContainer />
    </>
  )
}

export default Equipos