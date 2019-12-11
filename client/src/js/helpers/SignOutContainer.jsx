import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';

/**
 * Widget that facilitates user sign out.
 */
class SignOutContainer extends React.Component {
  render() {
    const { user } = this.props;

    return (
      <div>
        Logged in as {user.email}
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
