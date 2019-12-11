import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';
// Also, import other individual Firebase SDK components that we use
import 'firebase/auth';
import 'firebase/firestore';

import './index.css';
import AppRouter from './js/AppRouter';
import { HandleSignInLink } from './js/SignIn';
import { HandleDevError } from './js/DevError';

if (!process.env.REACT_APP_FIREBASE_ENV || !process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error("Environments var missing! Please refer to the README file")
  // TODO render a stupid component
  HandleDevError(c => ReactDOM.render(c, document.getElementById('root')));
}

firebase.initializeApp({
    "apiKey": process.env.REACT_APP_FIREBASE_API_KEY,
    "databaseURL": `https://${process.env.REACT_APP_FIREBASE_ENV}.firebaseio.com`,
    "storageBucket": `${process.env.REACT_APP_FIREBASE_ENV}.appspot.com`,
    "authDomain": `${process.env.REACT_APP_FIREBASE_ENV}.firebaseapp.com`,
    "messagingSenderId": "232849741230",
    "projectId": `${process.env.REACT_APP_FIREBASE_ENV}`,
});
//   firebase.firestore(); // initialize the firestore... why? who knows
//   console.log(firebase.firestore())
// firebase.firestore.setLogLevel('debug');

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in; render app
    ReactDOM.render(<AppRouter user={user} />, document.getElementById('root'));
  } else {
    // No user is signed in
    HandleSignInLink(c => ReactDOM.render(c, document.getElementById('root')));
  }
});
