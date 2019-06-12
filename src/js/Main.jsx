import React from 'react';
import Grid from '@material-ui/core/Grid';
import AgreementsContainer from './AgreementsContainer';
import NewAgreementContainer from './NewAgreementContainer';
import SignInContainer from './SignInContainer';

/**
 * Layout component for the page's main content.
 */
class Main extends React.Component {
  render() {

    let signInContainer;
    let newAgreementContainer;

    // Show a prompt to sign a new agreement if and only if we have a logged in user.
    if (this.props.user) {
      newAgreementContainer = (
        <NewAgreementContainer />
      );
    }

    return (
      <main className="mdl-layout__content mdl-color--grey-100">
        <Grid container>
          <Grid item>
            <AgreementsContainer
              header="Individual Agreements"
              description="Individual agreements we have on file for you:"
              columnTitles={["Name", "Date Signed", "Manage"]}
              data={this.props.individualCLATable}
            />
            <AgreementsContainer
              header="Institutional Agreements"
              description="Institutional agreements we have on file for you:"
              columnTitles={["Institution", "Date Signed", "View / Manage"]}
              data={this.props.institutionCLATable}
            />
          </Grid>
        </Grid>
        <Grid container>
          {newAgreementContainer}
        </Grid>
      </main>
    );
  }
}

export default Main;
