import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import bugsnag from '@bugsnag/js'

export const FirebaseAppInit = function (apiKey, projectName) {
  firebase.initializeApp({
    apiKey: apiKey,
    databaseURL: `https://${projectName}.firebaseio.com`,
    storageBucket: `${projectName}.appspot.com`,
    authDomain: `${projectName}.firebaseapp.com`,
    messagingSenderId: '232849741230',
    projectId: `${projectName}`
  })
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

export const FirebaseApp = firebase
