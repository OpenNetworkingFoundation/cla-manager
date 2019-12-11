import React from "react";
import firebase from 'firebase/app';

import { BrowserRouter as Router, Route } from "react-router-dom";

import Header from './helpers/Header';
import Home from './Home';
import SignPage from './claPages/SignPage';
import View from './View';

class AppRouter extends React.Component {

    constructor(props) {
        super(props);
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

    render() {
        const user = this.props.user;
        return (
            <Router>
            <div>
                <Header
                    user={user}
                    onSignOut={this.signOut}
                />
                <Route path="/" exact render={() => (
                    <Home user={user}/>
                )}/>
                <Route path="/sign/:type" render={props => (
                    <SignPage user={user} {...props} />
                )}/>
                <Route path="/view/:id" render={props => (
                    <View user={user} {...props} />
                )}/>
            </div>
            </Router>
        );
    }
}

export default AppRouter;
