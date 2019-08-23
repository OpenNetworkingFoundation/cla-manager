import React from 'react';
import firebase from 'firebase/app';

import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';

import AgreementsContainer from './helpers/AgreementsContainer';
import NewAgreementContainer from './helpers/NewAgreementContainer';
import ClaDb from './lib/ClaDb';

const dateOptions = {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false, timeZoneName: 'short'
};

/**
 * User home screen for this CLA Manager application.
 */
export default class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            individualCLATable: [],
            institutionCLATable: [],
        };
        this.db = new ClaDb()
    }

    /**
     * Update the page to show all CLAs associated to the logged in user's email.
     */
    componentDidMount() {
        const email = firebase.auth().currentUser.email
        if (!email) {
            // Clear all rows from the CLA tables.
            this.setState({
                individualCLATable: [],
                institutionCLATable: []
            });
            return;
        }

        this.claUnsubscribe = this.db.subscribeToClas(email,
            this.renderClaTables.bind(this));
    }

    /**
     * Unsubscribe from CLA DB updates.
     */
    componentWillUnmount() {
        if (this.claUnsubscribe) {
            this.claUnsubscribe();
            this.claUnsubscribe = null;
        }
    }

    /**
     * Renders the CLAs in the appropriate tables.
     */
    renderClaTables(snapshot) {
        if (snapshot || snapshot.size) {
            const individualCLATable = [];
            const institutionCLATable = [];

            snapshot.forEach(cla => {
                const type = cla.data().type || 'individual';
                const date = cla.data().dateSigned.toDate() || new Date();
                const linkUrl = `/view/${cla.id}`;
                const row = {
                    id: cla.id,
                    name: cla.data().signer,
                    date,
                    displayDate: date.toLocaleDateString('default', dateOptions),
                    link: <Link href={linkUrl}>View Agreement</Link>
                }

                if (type === 'individual') {
                    if (cla.data().signerDetails && cla.data().signerDetails.name) {
                        row.name = cla.data().signerDetails.name;
                    }
                    individualCLATable.push(row);
                } else if (type === 'institutional') {
                    institutionCLATable.push(row);
                } else {
                    console.log('unknown cla type: ', cla.data())
                    return
                }
            });
            this.setState({
                individualCLATable: individualCLATable.sort((a, b) => a.date - b.date),
                institutionCLATable: institutionCLATable.sort((a, b) => a.date - b.date)
            });
        } else {
            console.log("no clas :(")
        }
    }

    render() {
        return (
            <main>
                <Paper>
                    <Grid container>
                        <Grid item>
                            <AgreementsContainer
                                header='Individual Agreements'
                                description='Individual agreements we have on file for you:'
                                columnTitles={['Name', 'Date Signed', 'Manage']}
                                columnIds={['name', 'displayDate', 'link']}
                                data={this.state.individualCLATable}
                            />
                            <AgreementsContainer
                                header='Institutional Agreements'
                                description='Institutional agreements we have on file for you:'
                                columnTitles={['Institution', 'Date Signed', 'View / Manage']}
                                columnIds={['name', 'displayDate', 'link']}
                                data={this.state.institutionCLATable}
                            />
                        </Grid>
                    </Grid>
                    {this.props.user && (
                        <Grid container>
                            <NewAgreementContainer />
                        </Grid>
                    )}
                </Paper>
            </main>
        );
    }
}
