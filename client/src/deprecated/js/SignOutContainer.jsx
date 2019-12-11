import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import withRoot from '../withRoot';

class SignInContainer extends React.Component {
  render() {
    // todo: perhaps the outer container should be a <Card/>?
    return (
      <div id="sign-in-container"
                     class="mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet mdl-card__supporting-text">
        <p>
          Enter your email below. A link sent to you via email that you will use to sign in.
          This will automatically create an account for you if you do not have one already.
          The email that you enter should match your Git email.
        </p>
        <form onsubmit="return false">
          <Input style="display:inline;width:70%;" type="text" id="email" name="email" placeholder="Email"/>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" id="sign-in" name="signin">Sign In</button>
        </form>
      </div>
    );
  }
}