import React from 'react'
import SignOutContainer from './SignOutContainer'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import { Link, Button, Toolbar, Typography } from '@material-ui/core'

/**
 * Renders the standard header for pages within the CLA Manager application.
 */

const useStyles = makeStyles(theme => ({
  root: {
    '& * + *:not(:last-child)': {
      marginRight: theme.spacing(2)
    }
  },
  title: {
    flexGrow: 1
  }
}))

export default function Header (props) {
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
          <Link href="https://wiki.opennetworking.org/x/BgCUI" target="_blank">
            <Button variant='contained' color='secondary'>
              Know More
            </Button>
          </Link>
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
