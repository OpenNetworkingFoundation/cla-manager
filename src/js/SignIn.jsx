//TODO needs cleanup and comments
import React from 'react';
import firebase from 'firebase/app';

import Header from './helpers/Header';
// import { withStyles } from '@material-ui/core/styles';
// import AppBar from '@material-ui/core/AppBar';
// import Toolbar from '@material-ui/core/Toolbar';
// import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';

// const styles = theme => ({
//     button: {
//       margin: theme.spacing(1),
//     },
//     leftIcon: {
//       marginRight: theme.spacing(1),
//     },
//     rightIcon: {
//       marginLeft: theme.spacing(1),
//     },
//     iconSmall: {
//       fontSize: 20,
//     },
// });

export class SignIn extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          errorCode: null,
          errorMessage: null,
          successMessage: null,
        };
    
        this.signIn = this.signIn.bind(this);
    }
    
    signIn(event) {
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
            this.setState({
                successMessage: "Email sent. Check your inbox.", 
                errorCode: null, errorMessage: null
            })
            //document.getElementById('quickstart-sign-in').disabled = false;
        }).catch(error => {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode)
            console.log(errorMessage);
            this.setState({ errorCode, errorMessage, successMessage: null })
        });
        return false;
    }



    render() {
        // const classes = this.props.classes;
        return (
            <div>
                {/* {this.handleSignIn()} */}
                <Header />
                Need to sign in
                {/* TODO put an email field validator on this */}
                <form noValidate autoComplete="off" onSubmit={this.signIn}>
                    <TextField
                        id="email"
                        label="Email Address"
                        // onChange={handleChange('name')}
                        margin="normal"
                        variant="outlined"
                        //error={this.state.errorMessage}
                    />
                    {this.state.errorMessage}
                    {this.state.successMessage}
                    <Button 
                        variant="contained"
                        color="primary"
                        // className={classes.button}
                        onClick={this.signIn}
                    >
                        Send Sign In Link
                        {/* This Button uses a Font Icon, see the installation instructions in the docs. */}
                        <Icon /*className={classes.rightIcon}*/>send</Icon>
                    </Button>

                </form>
            </div>
        );
    }
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
  