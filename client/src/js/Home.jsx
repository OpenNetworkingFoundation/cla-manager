import React from 'react'
import { Firebase } from '../common/app/app'
import * as _ from 'lodash'
import AgreementsTable from './agreement/AgreementsTable'
import CreateAgreementContainer from './agreement/CreateAgreementContainer'
import { Agreement, AgreementType } from '../common/model/agreement'
import { Card, Grid, Paper, CardContent, Typography } from '@material-ui/core'


/**
 * User home screen for this CLA Manager application.
 */
export default class Home extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      individualCLATable: [],
      institutionCLATable: [],
      coveredCLA: []
    }
  }

  /**
   * Update the page to show all CLAs associated to the logged in user's email.
   */
  componentDidMount () {
    const email = Firebase.auth().currentUser.email
    if (!email) {
      // Clear all rows from the CLA tables.
      this.setState({
        individualCLATable: [],
        institutionCLATable: [],
        coveredCLA: []
      })
      return
    }

    this.claUnsubscribe = Agreement.subscribe(email,
      this.renderClaTables.bind(this), (err) => {
        // FIXME handle the error
        console.warn(err)
      })
      //Get CLA's that the user is covered by
      Agreement.getCoveredCLAs().then(res => {
        this.setState({coveredCLA: res})
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
    if (snapshot || snapshot.length) {
      const agreements = snapshot.reduce((obj, agr) => {
        if (agr.data().type === AgreementType.INDIVIDUAL) {
          obj.individualCLATable.push(Agreement.fromDocumentSnapshot(agr))
        }
        if (agr.data().type === AgreementType.INSTITUTIONAL) {
          if (_.find(obj.institutionCLATable, { id: agr.id }) == undefined) {
            obj.institutionCLATable.push(Agreement.fromDocumentSnapshot(agr))
          }
        }
        return obj
      }, { individualCLATable: [], institutionCLATable: [] })

      this.setState({
        individualCLATable: agreements.individualCLATable.sort((a, b) => a.date - b.date),
        institutionCLATable: agreements.institutionCLATable.sort((a, b) => a.date - b.date)
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
            <CreateAgreementContainer/>
          </Grid>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <AgreementsTable
              header='Individual Agreements'
              data={this.state.individualCLATable}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <AgreementsTable
              header='Institutional Agreements'
              extra_cols={[{ title: 'Organization', field: 'organization' }]}
              data={this.state.institutionCLATable}
            />
          </Grid>
        </Grid> 
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <AgreementsTable
              header='Covered by:'
              extra_cols={[{ title: 'Organization', field: 'organization' }]}
              data={this.state.coveredCLA}
            />
          </Grid>
        </Grid> 
      </main>
    )
  }
}
