import React from 'react';
import * as firebase from 'firebase';
import Main from './Main';
import Header from './Header';


/**
 * Top-level controller for this CLA Manager application.
 */
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      user: null,
      loginAttemptInProgress: false,
      individualCLATable: [],
      institutionCLATable: [],
    };

    this.signIn = this.handleSignIn.bind(this);
    this.signOut = this.handleSignOut.bind(this);
  }


  /**
   * Handles the sign in button press.
   */
  handleSignIn(email) {
    // Disable the sign-in button during async sign-in tasks.
    this.setState({ loginAttemptInProgress: true });

    // Sending email with sign-in link.
    var actionCodeSettings = {
      'url': window.location.href,
      'handleCodeInApp': true
     };
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings).then(() => {
      // Save the email locally so you don’t need to ask the user for it again if they open
      // the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
      // The link was successfully sent. Inform the user.
      alert('An email was sent to ' + email + '. Please use the link in the email to sign-in.');
      // Re-enable the sign-in button.
      this.setState({ loginAttemptInProgress: false });
    }).catch((error) => {
      // Handle Errors here.
      this.handleAuthError(error);
    });
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

  /**
   * Update the page to show all CLAs associated to the inputted email.
   */
  loadClas(email) {
    if (!email) {
      // Clear all rows from the CLA tables.
      this.setState({
        individualCLATable: [],
        institutionCLATable: []
      });
      return;
    }

    firebase.firestore().collection('clas')
      .where('whitelist', 'array-contains', email)
      .onSnapshot(this.renderClaTables.bind(this));
  }

  /**
   * Renders the CLAs in the appropriate tables.
   */
  renderClaTables(snapshot) {

      if (snapshot || snapshot.size) {
          const options = { year: 'numeric', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: 'numeric', hour12: false, timeZoneName: 'short' };
          const individualCLATable = [];
          const institutionCLATable = [];

          snapshot.forEach(cla => {
              console.log(cla.data())
              const type = cla.data().type || 'individual';
              const date = cla.data().dateSigned.toDate() || new Date();

              let name = cla.data().signer;
              const displayDate = date.toLocaleDateString('default', options);
              const link = `link ${cla.id}`;

              if (type === 'individual') {
                  if (cla.data().signerDetails && cla.data().signerDetails.name) {
                      name = cla.data().signerDetails.name;
                  }
                  individualCLATable.push([name, displayDate, link]);
              } else if (type === 'institutional') {
                  institutionCLATable.push(['foo', displayDate, link]);
              } else {
                  console.log('unknown cla type: ', cla.data())
                  return
              }
          });
          this.setState({
              individualCLATable,
              institutionCLATable
          });
      }
  }


  componentDidMount() {
    this.handleSignInLink();

    // Listening for auth state changes.
    firebase.auth().onAuthStateChanged(function(user) {
      console.log("statechange", user)
      if (user) {
        // User is signed in.
        this.loadClas(user.email);
      } else {
        // User is signed out.
        this.loadClas(null);
      }
    });
  }

  render() {
    return (
      <div>
        <Header
          user={this.state.user}
          onSignOut={this.signOut}
        />
        <Main
          user={this.state.user}
          loginAttemptInProgress={this.state.loginAttemptInProgress}
          onSignIn={this.signIn}
          individualCLATable={this.state.individualCLATable}
          institutionCLATable={this.state.institutionCLATable}
        />
      </div>
    );
  }
}

export default App;
