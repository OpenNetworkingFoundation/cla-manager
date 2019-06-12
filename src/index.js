import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './js/App';
import * as serviceWorker from './serviceWorker';

const firebase = window.firebase;
const PENDING_CRED_KEY = 'PENDING_CRED';

let errorOccurred = false;
// First, handle the case where a user has landed on this page after 
// being redirected from the Github sign in page. See call to
// firebase.auth().signInWithRedirect(...) below.
firebase.auth().getRedirectResult().then((result) => {
  // The firebase.User instance:
  var user = result.user;

  let pendingCred = JSON.parse(window.sessionStorage.getItem(PENDING_CRED_KEY));
  if (pendingCred) {
    // Remember that the user may have signed in with an account that has a different email
    // address than the first one. This can happen as Firebase doesn't control the provider's
    // sign in flow and the user is free to login using whichever account he owns.
    // Step 4b.
    // Link to GitHub credential.
    // As we have access to the pending credential, we can directly call the link method.
    result.user.linkAndRetrieveDataWithCredential(pendingCred).then(function(usercred) {
      // GitHub account successfully linked to the existing Firebase user.
      render(result.user);
    });
  }
  else {
    // The GitHub firebase.auth.AuthCredential containing the GitHub 
    // access token:
    var credential = result.credential;
    // As this API can be used for sign-in, linking and reauthentication,
    // check the operationType to determine what triggered this redirect
    // operation.
    var operationType = result.operationType;
    console.log(user, credential, operationType);
    render(user);
  }
}, (error) => {

  errorOccurred = true;
  // The provider's account email, can be used in case of
  // auth/account-exists-with-different-credential to fetch the providers
  // linked to the email:
  var email = error.email;
  // The provider's credential:
  var credential = error.credential;
  // In case of auth/account-exists-with-different-credential error,
  // you can fetch the providers using this:
  if (error.code === 'auth/account-exists-with-different-credential') {
    // Step 2.
    // User's email already exists.
    // The pending GitHub credential.
    var pendingCred = error.credential;
    window.sessionStorage.setItem(PENDING_CRED_KEY, JSON.stringify(pendingCred));

    // The provider account's email address.
    var email = error.email;
    // Get sign-in methods for this email.
    firebase.auth().fetchSignInMethodsForEmail(email).then(function(methods) {
      // Step 3.
      // If the user has several sign-in methods,
      // the first method in the list will be the "recommended" method to use.
      if (methods[0] === 'password') {
        // Asks the user their password.
        // In real scenario, you should handle this asynchronously.
        var password = 'foo'; // TODO: implement promptUserForPassword.
        firebase.auth().signInWithEmailAndPassword(email, password).then(function(user) {
          // Step 4a.
          return user.linkWithCredential(pendingCred);
        }).then(function() {
          // GitHub account successfully linked to the existing Firebase user.
          render(user);
        });
        return;
      }
      // All the other cases are external providers.
      // Construct provider object for that provider.
      // TODO: implement getProviderForProviderId.
      let provider = new firebase.auth.GoogleAuthProvider();
      // At this point, you should let the user know that he already has an account
      // but with a different provider, and let him validate the fact he wants to
      // sign in with this provider.
      // Sign in to provider. Note: browsers usually block popup triggered asynchronously,
      // so in real scenario you should ask the user to click on a "continue" button
      // that will trigger the signInWithPopup.
      firebase.auth().signInWithRedirect(provider);
    });


    firebase.auth().fetchSignInMethodsForEmail(email).then((providers) => {
      // The returned 'providers' is a list of the available providers
      // linked to the email address. Please refer to the guide for a more
      // complete explanation on how to recover from this error.
      console.log(providers);
    });
  }
});


let provider = new firebase.auth.GithubAuthProvider();
let user = firebase.auth().currentUser;
console.log(user);
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in.
    render(user); 
  } 
  else if (!errorOccurred) {
    // No user is signed in.
    // Sign in with redirect:
    firebase.auth().signInWithRedirect(provider);
  }
});


function render(user) {

  window.sessionStorage.removeItem(PENDING_CRED_KEY);
  ReactDOM.render(<App user={user} />, document.getElementById('root'));
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
