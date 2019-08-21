import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AppRouter from './js/AppRouter';
import SignIn from './js/SignIn';
import firebase from 'firebase/app';
import 'firebase/auth';

// import firebase from 'firebase';

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

async function handleSignIn() {
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {        
      // You can also get the other parameters passed in the query string such as state=STATE.
      // Get the email if available.
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
          // User opened the link on a different device. To prevent session fixation attacks, ask the
          // user to provide the associated email again. For example:
          email = window.prompt('Please provide the email you\'d like to sign-in with for confirmation.');
      }
      if (email) {
          try {
            const result = await firebase.auth().signInWithEmailLink(email, window.location.href);
            const history = window.history
            // Clear the URL to remove the sign-in link parameters.
            if (history && history.replaceState) {
                window.history.replaceState({}, document.title, window.location.href.split('?')[0]);
            }
            // Clear email from storage.
            window.localStorage.removeItem('emailForSignIn');
            // Signed-in user's information.
            // const user = result.user;
            const isNewUser = result.additionalUserInfo.isNewUser;
            if (isNewUser) {
                //TODO welcome new users via banner or something
                console.log("New User!");
            }
            return; // User is signed in; App will be loaded by onAuthStateChanged()
          } catch (error) {
/* 
  TODO could use the following if needed (or remove)
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
*/
                console.log(error);
          }
      }
    }
    ReactDOM.render(<SignIn />, document.getElementById('root'));
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in; render app
    ReactDOM.render(<AppRouter user={user} />, document.getElementById('root'));
  } else {
    // No user is signed in.
    handleSignIn();
  }
});
