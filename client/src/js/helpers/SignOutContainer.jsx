import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'

const useStyles = makeStyles(theme => ({
  loggedInAs: {
    paddingRight: theme.spacing(2)
  }
}))

/**
 * Widget that facilitates user sign out.
 */
function SignOutContainer (props) {
  const classes = useStyles()
  return (
    <div>
      <span className={classes.loggedInAs}>
        Logged in as {props.user.email}
      </span>
      <Button
        id='sign-out'
        name='signout'
        variant='outlined'
        endIcon={<ExitToAppIcon/>}
        onClick={props.onSignOut}
      >
        Sign Out
      </Button>
    </div>
  )
}

SignOutContainer.propTypes = {
  user: PropTypes.object.isRequired,
  onSignOut: PropTypes.func.isRequired
}

export default SignOutContainer
