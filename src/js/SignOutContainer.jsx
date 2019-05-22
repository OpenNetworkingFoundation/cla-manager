import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';

/**
 * Widget that facilitates user sign out.
 */
class SignOutContainer extends React.Component {
  render() {
    const { user } = this.props;

    // todo: perhaps the outer container should be a <Card/>?
    return (
      <div id="sign-out-container">
        Logged in as <span id="display-email">{user.email}</span>
        <Button
          id="sign-out"
          name="signout"
          onClick={this.props.onSignOut}
        >
          Sign Out
        </Button>
      </div>

    );
  }
}

SignOutContainer.propTypes = {
  user: PropTypes.object.isRequired,
  onSignOut: PropTypes.func.isRequired
};

export default SignOutContainer;
