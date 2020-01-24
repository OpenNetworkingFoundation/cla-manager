import React from 'react';
import ReactDOM from 'react-dom';
import {FirebaseAppInit, FirebaseApp} from './common/app/app';
// Also, import other individual Firebase SDK components that we use


import './index.css';
import AppRouter from './js/AppRouter';
import { HandleSignInLink } from './js/SignIn';
import { HandleDevError } from './js/DevError';

if (!process.env.REACT_APP_FIREBASE_ENV || !process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error("Environments var missing! Please refer to the README file")
  // TODO render a stupid component
  HandleDevError(c => ReactDOM.render(c, document.getElementById('root')));
}

FirebaseAppInit(process.env.REACT_APP_FIREBASE_API_KEY, process.env.REACT_APP_FIREBASE_ENV)

//   firebase.firestore(); // initialize the firestore... why? who knows
//   console.log(firebase.firestore())
// firebase.firestore.setLogLevel('debug');

FirebaseApp.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in; render app
    ReactDOM.render(<AppRouter user={user} />, document.getElementById('root'));
  } else {
    // No user is signed in
    HandleSignInLink(c => ReactDOM.render(c, document.getElementById('root')));
  }
});
