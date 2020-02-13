import React from 'react'
import ReactDOM from 'react-dom'
import { FirebaseApp, FirebaseAppInit } from './common/app/app'
import bugsnag from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'
// Also, import other individual Firebase SDK components that we use
import './index.css'
import AppRouter from './js/AppRouter'
import { HandleSignInLink } from './js/SignIn'
import { HandleDevError } from './js/DevError'

// For dev, no bugsnag key env should be set to avoid reporting errors.
const bugnsnagApiKey = !process.env.REACT_APP_BUGSNAG_API_KEY
  ? 'do-not-report' : process.env.REACT_APP_BUGSNAG_API_KEY
const bugsnagClient = bugsnag(bugnsnagApiKey)
bugsnagClient.use(bugsnagReact, React)

if (!process.env.REACT_APP_FIREBASE_ENV || !process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error('Environments var missing! Please refer to the README file')
  // eslint-disable-next-line react/no-render-return-value
  HandleDevError(c => ReactDOM.render(c, document.getElementById('root')))
}

FirebaseAppInit(process.env.REACT_APP_FIREBASE_API_KEY, process.env.REACT_APP_FIREBASE_ENV)

//   firebase.firestore(); // initialize the firestore... why? who knows
//   console.log(firebase.firestore())
// firebase.firestore.setLogLevel('debug');

const ErrorBoundary = bugsnagClient.getPlugin('react')

FirebaseApp.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in; render app
    ReactDOM.render(
      <ErrorBoundary>
        <AppRouter user={user}/>
      </ErrorBoundary>,
      document.getElementById('root'))
  } else {
    // No user is signed in
    // eslint-disable-next-line react/no-render-return-value
    HandleSignInLink(c => ReactDOM.render(
      <ErrorBoundary>
        c
      </ErrorBoundary>,
      document.getElementById('root')))
  }
})
