import React from 'react'
import PropTypes from 'prop-types'
import { Link, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AccountBox from '@material-ui/icons/AccountBox'

const useStyles = makeStyles(theme => ({
  loggedInAs: {
    paddingRight: theme.spacing(2)
  },
  link: {
    color: theme.palette.common.white,
    borderColor: theme.palette.common.white,
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
        variant='outlined'
        startIcon={<AccountBox/>}
        className={classes.link}>
        <Link className={classes.link} href="/linked-accounts">
          Linked Accounts
        </Link>
      </Button>
      <Button
        id='sign-out'
        name='signout'
        variant='outlined'
        endIcon={<ExitToAppIcon/>}
        onClick={props.onSignOut}
        className={classes.link}
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
