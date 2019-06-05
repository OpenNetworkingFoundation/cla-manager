import React from 'react';
import Card from '@material-ui/core/Card';
import Header from './Header';
import CLADisplayWidget from './CLADisplayWidget';


const firebase = window.firebase;

/**
 * Handles Errors from various Promises.
 */
function handleError(error) {
  // Display Error.
  alert('Error: ' + error.message);
  console.log(error);
}


/**
 * Top-level controller for the page to sign a CLA. 
 */
class SignPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      user: null
    };

    this.signOut = this.handleSignOut.bind(this);
    this.handleCLASignature = this.handleCLASignature.bind(this);
  }


  /**
   * Handles the sign out button press.
   */
  handleSignOut() {
    firebase.auth().signOut().catch((error) => {
      this.handleAuthError(error);
    });
  }

  /**
   * Handles Errors from various Promises.
   */
  handleAuthError(error) {
    // Display Error.
    alert('Error: ' + error.message);
    console.log(error);
    // Re-enable the sign-in button.
    this.setState({ loginAttemptInProgress: false });
  }


  /**
   * Handles automatically signing-in the app if we clicked on the sign-in link in the email.
   */
  handleSignInLink() {
    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
      // Disable the sign-in button during async sign-in tasks.
      this.setState({ loginAttemptInProgress: true });

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
        firebase.auth().signInWithEmailLink(email, window.location.href).then((result) => {

          // Clear the URL to remove the sign-in link parameters.
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.href.split('?')[0]);
          }
          // Clear email from storage.
          window.localStorage.removeItem('emailForSignIn');
          // Signed-in user's information.
          console.log(result)
        }).catch((error) => {
          // Handle Errors here.
          this.handleAuthError(error);
        });
      }
    }
  }

  signIndividualCLA() {
    let email = firebase.auth().currentUser.email;
    let name = document.getElementById('individual-name').value;
    console.log("individual", name, email)

    if(!email || !name) {
        alert("invalid email or name");
        return;
    }

    firebase.firestore().collection('clas').add({
      signer: email,
      signerDetails: { name, email },
      whitelist: [ email ],
      type: "individual",
      dateSigned: new Date()
    }).then(ref => {
      console.log('Added document with ID: ', ref.id);
      window.location.href = "/";
    }).catch(function(error) {
      handleError(error);
    });
  }

  signInstitutionalCLA() {
    let email = firebase.auth().currentUser.email
    let name = document.getElementById('signer-name').value
    if(!email || !name) {
        alert("invalid email or name");
        return;
    }

    const signerDetails = {
        name,
        email,
        title: document.getElementById('signer-title').value
    }
    const institution = {
        name: document.getElementById('institution-name').value,
        address: document.getElementById('institution-address').value
    }
    const adminDetails = [
        {
            name: document.getElementById('primary-name').value,
            email: document.getElementById('primary-email').value.toLowerCase(),
            phone: document.getElementById('primary-phone').value
        },
        {
            name: document.getElementById('secondary-name').value,
            email: document.getElementById('secondary-email').value.toLowerCase(),
            phone: document.getElementById('secondary-phone').value
        }
    ]

    const whitelist = document.getElementById('institutional-whitelist').value
                              .toLowerCase()
                              .split(/[\n,; ]+/)
    console.log('whitelist', whitelist)

    firebase.firestore().collection('clas').add({
      signer: signerDetails.email,
      signerDetails,
      institution,
      admins: adminDetails.map(a => a.email),
      adminDetails,
      whitelist,
      //blacklist FIXME
      //domain FIXME
      type: "institutional",
      dateSigned: new Date()
    }).then(ref => {
      console.log('Added document with ID: ', ref.id);
      //window.location.href = "/";
    }).catch(function(error) {
      handleError(error);
    });
  }

  handleCLASignature() {
    const claType = new URLSearchParams(window.location.search).get('kind');
    if (claType === 'institutional') {
      this.signInstitutionalCLA();
    }
    else {
      this.signIndividualCLA();
    }
  }

  componentDidMount() {
    this.handleSignInLink();

    // Listening for auth state changes.
    firebase.auth().onAuthStateChanged((user) => {
      console.log("statechange", user)
      this.setState({user});
    });
  }

  render() {
    return (
      <div>
        <div class="mdl-layout mdl-js-layout mdl-layout--fixed-header">
      <Header
        user={this.state.user}
        onSignOut={this.signOut}
      />
    <main class="mdl-layout__content mdl-color--grey-100">
      <div class="page-content mdl-grid">

        <Card> 
          <div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">
            <h2 class="mdl-card__title-text">Contributor License Agreement</h2>
          </div>

          <CLADisplayWidget
            user={this.state.user}
            onSubmit={this.handleCLASignature}
          />
        </Card>
      </div>
    </main>
  </div>
 
      </div>
    );
  }
}

export default SignPage;
