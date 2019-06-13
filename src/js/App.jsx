import React from 'react';
//import * as firebase from 'firebase';
import Main from './Main';
import Header from './Header';

const firebase = window.firebase;

/**
 * Top-level controller for this CLA Manager application.
 */
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      individualCLATable: [],
      institutionCLATable: [],
    };

    this.signOut = this.handleSignOut.bind(this);
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
      } else {
          console.log("no clas :(")
      }
  }


  componentDidMount() {

  }

  render() {
    return (
      <div>
        <Header
          user={this.props.user}
          onSignOut={this.signOut}
        />
        hello world
        <Main
          user={this.props.user}
          onSignIn={() => {}}
          individualCLATable={this.state.individualCLATable}
          institutionCLATable={this.state.institutionCLATable}
        />
      </div>
    );
  }
}

export default App;
