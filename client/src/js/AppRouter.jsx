import React from 'react'
import { Firebase } from '../common/app/app'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import PropTypes from 'prop-types'
import Header from './helpers/Header'
import Home from './Home'
import { Container } from '@material-ui/core'
import AgreementContainer from './agreement/AgreementContainer'
import SignCheck from './helpers/SignCheck'
import AdminAgreementsList from './admin/AdminAgreementsList'
import AdminIdentitiesList from './admin/AdminIdentitiesList'
import AppUserAccountsContainer from './user/AppUserAccountsContainer'
import PermissionDenied from './admin/PermissionDenied'
import AdminLinkedAccountList from './admin/AdminLinkedAccountsList'
import AdminDomains from './admin/AdminDomains'

class AppRouter extends React.Component {
  constructor (props) {
    super(props)
    this.signOut = this.handleSignOut.bind(this)
  }

  /**
   * Handles the sign out button press.
   */
  handleSignOut () {
    Firebase.auth().signOut().catch((error) => {
      this.handleAuthError(error)
    })
  }

  /**
   * Handles Errors from various Promises.
   */
  handleAuthError (error) {
    // Display Error.
    alert('Error: ' + error.message)
    console.log(error)
    // Re-enable the sign-in button.
    this.setState({ loginAttemptInProgress: false })
  }

  render () {
    const user = this.props.user
    return (
        <div>
          <Header
            user={user}
            onSignOut={this.signOut}
            isAdmin={this.props.isAdmin}
          />
          <Container className={'print-no-shade print-no-padding'}>
            <Route
              path='/' exact render={() => (
              <Home user={user}/>
            )}
            />
            <Route
              path='/sign/:type' render={props => (
              <SignCheck agreementType={props.match.params.type} user={user}/>
            )}
            />
            <Route
              path='/view/:id' render={props => (
              <AgreementContainer user={user} agreementId={props.match.params.id}/>
            )}
            />
            <Route
              path='/linked-accounts' exact render={() => <AppUserAccountsContainer/>}
            />
            <Route
              path='/admin/agreements' exact render={() => {
              if (this.props.isAdmin) {
                return <AdminAgreementsList/>
              }
              return <PermissionDenied/>
            }}
            />
            <Route
              path='/admin/identities' exact render={() => {
              if (this.props.isAdmin) {
                return <AdminIdentitiesList/>
              }
              return <PermissionDenied/>
            }}
            />
            <Route
              path='/admin/linked-accounts' exact render={() => {
              if (this.props.isAdmin) {
                return <AdminLinkedAccountList/>
              }
              return <PermissionDenied/>
            }}
            />
            <Route
              path='/admin/manage-domains' exact render={() => {
              if (this.props.isAdmin) {
                return <AdminDomains/>
              }
              return <PermissionDenied/>
            }}
            />
          </Container>
        </div>
    )
  }
}

AppRouter.propTypes = {
  user: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool.isRequired
}

export default AppRouter
