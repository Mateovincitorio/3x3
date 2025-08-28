// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALsR3__lrixB2HRDDpH04yBZGfxx3vrAE",
  authDomain: "torneosmvp.firebaseapp.com",
  projectId: "torneosmvp",
  storageBucket: "torneosmvp.firebasestorage.app",
  messagingSenderId: "965338708766",
  appId: "1:965338708766:web:b87d4e437b1bbbd418a70f",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence);
