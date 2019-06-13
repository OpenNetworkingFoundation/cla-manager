import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './js/App';
import SignIn from './js/SignIn';
//import * as serviceWorker from './serviceWorker';

const firebase = window.firebase;

function handleSignIn() {
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {        
      // You can also get the other parameters passed in the query string such as state=STATE.
      // Get the email if available.
      var email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
          // User opened the link on a different device. To prevent session fixation attacks, ask the
          // user to provide the associated email again. For example:
          email = window.prompt('Please provide the email you\'d like to sign-in with for confirmation.');
      }
      if (email) {
          // The client SDK will parse the code from the link for you.
          firebase.auth().signInWithEmailLink(email, window.location.href).then(function(result) {
              const history = window.history
              // Clear the URL to remove the sign-in link parameters.
              if (history && history.replaceState) {
                  window.history.replaceState({}, document.title, window.location.href.split('?')[0]);
              }
              // Clear email from storage.
              window.localStorage.removeItem('emailForSignIn');
              // Signed-in user's information.
              var user = result.user;
              var isNewUser = result.additionalUserInfo.isNewUser;
              console.log(result)
          }).catch(function(error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
              console.log(error);
          });
      }
  } else {
    ReactDOM.render(<SignIn />, document.getElementById('root'));
  }
}

let user = firebase.auth().currentUser;
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in.
    ReactDOM.render(<App user={user} />, document.getElementById('root'));
  } 
  else {
    // No user is signed in.
    handleSignIn();
  }
});


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.unregister();
