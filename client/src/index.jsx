import React from 'react'
import ReactDOM from 'react-dom'
import { FirebaseApp, FirebaseAppInit, BugSnagInit } from './common/app/app'
import bugsnagReact from '@bugsnag/plugin-react'
// Also, import other individual Firebase SDK components that we use
import './index.css'
import AppRouter from './js/AppRouter'
import { HandleSignInLink } from './js/SignIn'
import { HandleDevError } from './js/DevError'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import Container from '@material-ui/core/Container'

// For dev, no bugsnag key env should be set to avoid reporting errors.
const bugnsnagApiKey = !process.env.REACT_APP_BUGSNAG_API_KEY
  ? 'do-not-report' : process.env.REACT_APP_BUGSNAG_API_KEY
const bugsnagClient = BugSnagInit(bugnsnagApiKey)
bugsnagClient.use(bugsnagReact, React)

if (!process.env.REACT_APP_FIREBASE_ENV || !process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error('Environments var missing! Please refer to the README file')
  // eslint-disable-next-line react/no-render-return-value
  HandleDevError(c => ReactDOM.render(c, document.getElementById('root')))
}

FirebaseAppInit(process.env.REACT_APP_FIREBASE_API_KEY, process.env.REACT_APP_FIREBASE_ENV)

const ErrorBoundary = bugsnagClient.getPlugin('react')

FirebaseApp.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in; fetch token and render app
    FirebaseApp.auth().currentUser.getIdTokenResult()
      .then(token => {
        ReactDOM.render(
          <ErrorBoundary>
            <AppRouter user={user} isAdmin={token.claims.admin || false}/>
          </ErrorBoundary>,
          document.getElementById('root'))
      })
      .catch(err => {
        bugsnagClient.notify(err)
        console.error(err)
        ReactDOM.render(<ErrorBoundary>
          <Container component='main' maxWidth='xs'>
            <Card>
              <CardContent>
                <Typography variant='h5' component='h2'>
                  Unknow error
                </Typography>
                <Typography color='textSecondary'>
                  Sorry for the inconvience, be aware that the error has been reported to us and we're investigating
                </Typography>
              </CardContent>
            </Card>
          </Container>
        </ErrorBoundary>,
        document.getElementById('root'))
      })
  } else {
    // No user is signed in
    // eslint-disable-next-line react/no-render-return-value
    HandleSignInLink(c => ReactDOM.render(
      <ErrorBoundary>
        {c}
      </ErrorBoundary>,
      document.getElementById('root')))
  }
})
