import React from 'react'
import { FirebaseApp } from '../common/app/app'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'

import AgreementsTable from './agreement/AgreementsTable'
import CreateAgreementContainer from './agreement/CreateAgreementContainer'

import { Agreement, AgreementType } from '../common/model/agreement'
import { Button } from '@material-ui/core'

const dateOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
  timeZoneName: 'short'
}

/**
 * User home screen for this CLA Manager application.
 */
export default class Home extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      individualCLATable: [],
      institutionCLATable: []
    }
  }

  /**
   * Update the page to show all CLAs associated to the logged in user's email.
   */
  componentDidMount () {
    const email = FirebaseApp.auth().currentUser.email
    if (!email) {
      // Clear all rows from the CLA tables.
      this.setState({
        individualCLATable: [],
        institutionCLATable: []
      })
      return
    }

    this.claUnsubscribe = Agreement.subscribe(email,
      this.renderClaTables.bind(this), (err) => {
        // FIXME handle the error
        console.warn(err)
      })
  }

  /**
   * Unsubscribe from CLA DB updates.
   */
  componentWillUnmount () {
    if (this.claUnsubscribe) {
      this.claUnsubscribe()
      this.claUnsubscribe = null
    }
  }

  /**
   * Renders the CLAs in the appropriate tables.
   */
  renderClaTables (snapshot) {
    if (snapshot || snapshot.size) {
      const individualCLATable = []
      const institutionCLATable = []

      snapshot.forEach(cla => {
        const type = cla.data().type || 'individual'
        const date = cla.data().dateSigned.toDate() || new Date()
        const linkUrl = `/view/${cla.id}`
        const row = {
          id: cla.id,
          name: cla.data().signer.name,
          date,
          displayDate: date.toLocaleDateString('default', dateOptions),
          link: <Link href={linkUrl}><Button variant='outlined' color='primary'>View/Edit</Button></Link>
        }

        if (type === AgreementType.INDIVIDUAL) {
          if (cla.data().signerDetails && cla.data().signerDetails.name) {
            row.name = cla.data().signerDetails.name
          }
          individualCLATable.push(row)
        } else if (type === AgreementType.CORPORATE) {
          row.organization = cla.data().organization
          institutionCLATable.push(row)
        } else {
          console.log('unknown cla type: ', cla.data())
        }
      })

      this.setState({
        individualCLATable: individualCLATable.sort((a, b) => a.date - b.date),
        institutionCLATable: institutionCLATable.sort((a, b) => a.date - b.date)
      })
    } else {
      console.log('no clas :(')
    }
  }

  render () {
    // TODO use makeStyles (this can't be a class to do that)
    const style = {
      marginBottom: '16px',
      marginTop: '50px'
    }
    return (
      <main>
        {this.props.user && (
          <Grid container style={style}>
            <CreateAgreementContainer />
          </Grid>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <AgreementsTable
              header='Individual Agreements'
              description='Individual agreements we have on file for you:'
              columnTitles={['Signatory', 'Date Signed', 'Actions']}
              columnIds={['name', 'displayDate', 'link']}
              data={this.state.individualCLATable}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <AgreementsTable
              header='Institutional Agreements'
              description='Institutional agreements we have on file for you:'
              columnTitles={['Organization', 'Signatory', 'Date Signed', 'Actions']}
              columnIds={['organization', 'name', 'displayDate', 'link']}
              data={this.state.institutionCLATable}
            />
          </Grid>
        </Grid>
      </main>
    )
  }
}
