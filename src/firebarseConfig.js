// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tus credenciales (cambia esto por las tuyas desde Firebase > Configuración del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyALsR3__lrixB2HRDDpH04yBZGfxx3vrAE",
  authDomain: "torneosmvp.firebaseapp.com",
  projectId: "torneosmvp",
  storageBucket: "torneosmvp.firebasestorage.app",
  messagingSenderId: "965338708766",
  appId: "1:965338708766:web:b87d4e437b1bbbd418a70f",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la base de datos
export const db = getFirestore(app);
