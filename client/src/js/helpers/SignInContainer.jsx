import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';

/**
 * Widget that facilitates user sign in.
 */
class SignInContainer extends React.Component {
  render() {
    // todo: perhaps the outer container should be a <Card/>?
    return (
      <div id="sign-in-container"
                     className="mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet mdl-card__supporting-text">
        <p>
          Enter your email below. A link sent to you via email that you will use to sign in.
          This will automatically create an account for you if you do not have one already.
          The email that you enter should match your Git email.
        </p>
        <form onSubmit={(e) => this.props.onSignIn(e.target.querySelector('input').value)}>
          <Input 
            style={{ display: 'inline', width: '70%' }} 
            type="text" id="email"
            name="email" 
            placeholder="Email"
          />
          &nbsp;&nbsp;&nbsp;
          <Input type="submit" id="sign-in" name="signin">Sign In</Input>
        </form>
      </div>
    );
  }
}

SignInContainer.propTypes = {
  onSignIn: PropTypes.func.isRequired
};

export default SignInContainer;
