//TODO needs cleanup and comments
import React, { useState } from 'react';
import firebase from 'firebase/app';

import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
    textAlign: 'center'
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  },
  sendIcon: {
    marginLeft: theme.spacing(1)
  },
  resultMessage: {}
}));


export default function SignIn() {
    const [errorCode, setErrorCode] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const classes = useStyles();
    
    const signIn = (event) => {
        event.preventDefault();
        event.stopPropagation();
        var email = document.getElementById('email').value;
        // Sending email with sign-in link.
        var actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this URL
            // must be whitelisted in the Firebase Console.
            'url': window.location.href, // Here we redirect back to this same page.
            'handleCodeInApp': true // This must be true.
        };

        firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings).then(() => {
            // Save the email locally so you don’t need to ask the user for it again if they open
            // the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
            // The link was successfully sent. Inform the user.
            alert('An email was sent to ' + email + '. Please use the link in the email to sign-in.');
            // Re-enable the sign-in button.
            setSuccessMessage("Email sent. Check your inbox.");
            setErrorCode(null);
            setErrorMessage(null);
            //document.getElementById('quickstart-sign-in').disabled = false;
        }).catch(error => {
            // Handle Errors here.
            let newErrorCode = error.code;
            let newErrorMessage = error.message;
            console.log(newErrorCode)
            console.log(newErrorMessage);
            setErrorCode(newErrorCode);
            setErrorMessage(newErrorMessage);
            setSuccessMessage(null);
        });
        return false;
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <form 
                    className={classes.form}
                    onSubmit={(e) => e.preventDefault()}
                    noValidate
                >
                     <TextField
                         variant="outlined"
                         margin="normal"
                         required
                         fullWidth
                         id="email"
                         label="Email Address"
                         name="email"
                         autoComplete="email"
                         autoFocus
                     />
                     <Button
                         className={classes.submit}
                         variant="contained"
                         color="primary"
                         // className={classes.button}
                         onClick={signIn}
                     >
                         Send Sign In Link
                         {/* This Button uses a Font Icon, see the installation instructions in the docs. */}
                         <Icon className={classes.sendIcon}>send</Icon>
                     </Button>
                     <div className={classes.resultMessage}>
                         {errorMessage}
                         {successMessage}
                     </div>
                </form>
            </div>
        </Container>
    );
}
  
// export default withStyles(styles)(SignIn);

/**
 * Handles the Sign In by Email link URL parameters.
 * 
 * Returns true if user is logged in, false otherwise
 */
export async function HandleSignInLink(fn) {
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
      fn(<SignIn />)
  }
  
