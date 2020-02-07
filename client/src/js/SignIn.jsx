// TODO needs cleanup and comments
import React, { useState } from 'react'
import { FirebaseApp } from '../common/app/app'

import { makeStyles } from '@material-ui/core/styles'
import { TextField, Grid, Button, Container, Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab';
import SendIcon from '@material-ui/icons/Send'

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white
    }
  },
  root: {
    display: 'flex',
    flexGrow: 1,
    height: '100%'
  },
  mainGrid: {
    margin: 'auto',
    'text-align': 'center'
  },
  button: {
    'margin-top': theme.spacing(2)
  }
}))

export default function SignIn () {
  // eslint-disable-next-line
  const [errorCode, setErrorCode] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const classes = useStyles()

  const signIn = (event) => {
    event.preventDefault()
    event.stopPropagation()
    var email = document.getElementById('email').value
    // Sending email with sign-in link.
    var actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this URL
      // must be whitelisted in the Firebase Console.
      url: window.location.href, // Here we redirect back to this same page.
      handleCodeInApp: true // This must be true.
    }

    FirebaseApp.auth().sendSignInLinkToEmail(email, actionCodeSettings).then(() => {
      // Save the email locally so you don’t need to ask the user for it again if they open
      // the link on the same device.
      window.localStorage.setItem('emailForSignIn', email)

      // Re-enable the sign-in button.
      setSuccessMessage('Email sent. Check your inbox.')
      setErrorCode(null)
      setErrorMessage(null)
      // document.getElementById('quickstart-sign-in').disabled = false;
    }).catch(error => {
      // Handle Errors here.
      const newErrorCode = error.code
      const newErrorMessage = error.message
      console.log(newErrorCode)
      console.log(newErrorMessage)
      setErrorCode(newErrorCode)
      setErrorMessage(newErrorMessage)
      setSuccessMessage(null)
    })
    return false
  }

  return (
    <Container component='main' maxWidth='xs' className={classes.root} height="100%">
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
        spacing={2}
        className={classes.mainGrid}
      >
        <Grid item xs={12}>
          <img src={process.env.PUBLIC_URL + '/assets/onf-logo.jpg'}/>
        </Grid>
        <Grid item xs={12}>
          <Box>
            <h1>CLA Manager</h1>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <form
            onSubmit={(e) => e.preventDefault()}
            noValidate
          >
            <TextField
              variant='outlined'
              margin='normal'
              required
              fullWidth
              id='email'
              label='Email Address'
              name='email'
              autoComplete='email'
              autoFocus
            />
            <p>Welcome to the Contributor Management tool. If you intend to sing a corporate agreement, please login with your corporate email</p>
            <Button
              className={classes.button}
              variant='contained'
              color='primary'
              size='large'
              onClick={signIn}
              endIcon={<SendIcon/>}
            >
              Send Sign In Link
            </Button>
          </form>
        </Grid>
        <Grid item xs={12}>
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null }
          {errorMessage ? <Alert severity="success">{errorMessage}</Alert> : null }
        </Grid>
      </Grid>
    </Container>
  )
}

// export default withStyles(styles)(SignIn);

/**
 * Handles the Sign In by Email link URL parameters.
 *
 * Returns true if user is logged in, false otherwise
 */
export async function HandleSignInLink (fn) {
  if (FirebaseApp.auth().isSignInWithEmailLink(window.location.href)) {
    // You can also get the other parameters passed in the query string such as state=STATE.
    // Get the email if available.
    let email = window.localStorage.getItem('emailForSignIn')
    if (!email) {
      // User opened the link on a different device. To prevent session fixation attacks, ask the
      // user to provide the associated email again. For example:
      email = window.prompt('Please provide the email you\'d like to sign-in with for confirmation.')
    }
    if (email) {
      try {
        const result = await FirebaseApp.auth().signInWithEmailLink(email, window.location.href)
        const history = window.history
        // Clear the URL to remove the sign-in link parameters.
        if (history && history.replaceState) {
          window.history.replaceState({}, document.title, window.location.href.split('?')[0])
        }
        // Clear email from storage.
        window.localStorage.removeItem('emailForSignIn')
        // Signed-in user's information.
        // const user = result.user;
        const isNewUser = result.additionalUserInfo.isNewUser
        if (isNewUser) {
          // TODO welcome new users via banner or something
          console.log('New User!')
        }
        return // User is signed in; App will be loaded by onAuthStateChanged()
      } catch (error) {
        /*
    TODO could use the following if needed (or remove)
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
  */
        console.log(error)
      }
    }
  }
  fn(<SignIn/>)
}
