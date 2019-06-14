import React from 'react';
import Grid from '@material-ui/core/Grid';
import AgreementsContainer from './AgreementsContainer';
import NewAgreementContainer from './NewAgreementContainer';


const firebase = window.firebase;

/**
 * Top-level controller for this CLA Manager application.
 */
class Manage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      individualCLATable: [],
      institutionCLATable: [],
    };
  }


  /**
   * Update the page to show all CLAs associated to the inputted email.
   */
  loadClas() {
    const email = firebase.auth().currentUser.email
    if (!email) {
      // Clear all rows from the CLA tables.
      this.setState({
        individualCLATable: [],
        institutionCLATable: []
      });
      return;
    }

    this.claUnsubscribe = firebase.firestore().collection('clas')
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
    this.loadClas();
  }

  componentWillUnmount() {
    if (this.claUnsubscribe) {
      this.claUnsubscribe();
      this.claUnsubscribe = null;
    }
  }

  render() {
    return (
      <main className="mdl-layout__content mdl-color--grey-100">
        <Grid container>
          <Grid item>
            <AgreementsContainer
              header="Individual Agreements"
              description="Individual agreements we have on file for you:"
              columnTitles={["Name", "Date Signed", "Manage"]}
              data={this.state.individualCLATable}
            />
            <AgreementsContainer
              header="Institutional Agreements"
              description="Institutional agreements we have on file for you:"
              columnTitles={["Institution", "Date Signed", "View / Manage"]}
              data={this.state.institutionCLATable}
            />
          </Grid>
        </Grid>
        {this.props.user && (
          <Grid container>
            <NewAgreementContainer />
         </Grid>
        )}
      </main>
    );
  }
}

export default Manage;
