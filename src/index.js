import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';
// Also, import other individual Firebase SDK components that we use
import 'firebase/auth';
import 'firebase/firestore';

import './index.css';
import AppRouter from './js/AppRouter';
import { HandleSignInLink } from './js/SignIn';

firebase.initializeApp({
    "apiKey": "AIzaSyDai4LocdZpoa0t219SDqOEQ4ipMQVOVvQ",
    "databaseURL": "https://cla-manager-bf923.firebaseio.com",
    "storageBucket": "cla-manager-bf923.appspot.com",
    "authDomain": "cla-manager-bf923.firebaseapp.com",
    "messagingSenderId": "232849741230",
    "projectId": "cla-manager-bf923"
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
