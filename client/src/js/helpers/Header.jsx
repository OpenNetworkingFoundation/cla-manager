import React from 'react'
import SignOutContainer from './SignOutContainer'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Link from '@material-ui/core/Link'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import PropTypes from 'prop-types'
import AdminNav from './AdminNavigation'

/**
 * Renders the standard header for pages within the CLA Manager application.
 */

const useStyles = makeStyles({
  root: {
    flexGrow: 1
  },
  title: {
    flexGrow: 1
  }
})

function Header (props) {
  const classes = useStyles()
  const user = props.user

  return (
    <div className={classes.root}>
      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6' className={classes.title}>
            <Link href='/' color='inherit'>
              ONF CLA Manager
            </Link>
          </Typography>
          {props.isAdmin ? <AdminNav/> : null}
          {user && (
            <SignOutContainer
              user={user}
              onSignOut={props.onSignOut}
            />
          )}
        </Toolbar>
      </AppBar>
    </div>
  )
}

Header.propTypes = {
  user: PropTypes.object.isRequired,
  onSignOut: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired
}

export default Header
