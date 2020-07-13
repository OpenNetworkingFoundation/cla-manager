import firebase from 'firebase'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/functions'
import bugsnag from '@bugsnag/js'

export const FirebaseAppInit = function (apiKey, projectName, emulator = 'false') {
  firebase.initializeApp({
    apiKey: apiKey,
    databaseURL: `https://${projectName}.firebaseio.com`,
    storageBucket: `${projectName}.appspot.com`,
    authDomain: `${projectName}.firebaseapp.com`,
    messagingSenderId: '232849741230',
    projectId: `${projectName}`
  })

  if (emulator === 'true') {
    console.info("Running the app using the Firebase emulator, make sure it's running")
    // Running in emulator.
    firebase.functions()
      .useFunctionsEmulator('http://localhost:5001')
  }
}

/**
 *
 * @type {null}
 */
let bugsnagClient = null

/**
 * Initialize the Bugsnag client with the API Key
 * @param apiKey {string}
 * @returns {BugsnagCore.Client}
 * @constructor
 */
export const BugsnagInit = (apiKey) => {
  bugsnagClient = bugsnag(apiKey)
  return bugsnagClient
}

/**
 * Initialize the initialized Bugsnag client
 * @returns {BugsnagCore.Client}
 * @constructor
 */
export const GetBugsnagClient = () => {
  return bugsnagClient
}

export const Firebase = firebase
