import React from 'react';
import SignOutContainer from './SignOutContainer';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

/**
 * Renders the standard header for pages within the CLA Manager application.
 */

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
  },
});

export default function Header(props) {
  const classes = useStyles();
  const user = props.user;

  return (
    <div className={classes.root}>
      <AppBar position="static" /*color="default"*/>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            CLAM (Your friendly CLA Manager)
          </Typography>
          {user && (
              <SignOutContainer
                user={user}
                onSignOut={props.onSignOut}
              />
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
}
