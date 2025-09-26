import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const firebaseConfig = {
  apiKey: "AIzaSyBD8-9mZJkOWrJqwyaJEgndw4_EHJ8YKxM",
  authDomain: "chatyou-89cec.firebaseapp.com",
  databaseURL: "https://chatyou-89cec-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatyou-89cec",
  storageBucket: "chatyou-89cec.appspot.com",
  messagingSenderId: "581474208654",
  appId: "1:581474208654:web:924db50831230ca1acf2df"
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.database();
export default firebase;
