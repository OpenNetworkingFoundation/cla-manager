import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Header from './Header';
import Manage from './Manage';
import SignPage from './SignPage';


function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

const firebase = window.firebase; 

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
                {/* <Link to="/users/">Users</Link> */}
                <Route path="/" exact render={() => (
                    <Manage user={user}/>
                )}/>
                <Route path="/sign/:type" render={props => (
                    <SignPage user={user} {...props} />
                )}/>
                {/* <Route path="/users/" component={Users} /> */}
            </div>
            </Router>
        );
    }
}

export default AppRouter;
