import React from 'react'
import { Alert, AlertTitle } from '@material-ui/lab'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  alert: {
    'margin-top': theme.spacing(2)
  },
}))

function PermissionDenied (props) {
  const classes = useStyles()
  return (
    <div>
      <Alert severity="error" className={classes.alert}>
        <AlertTitle>Permission Denied!</AlertTitle>
        <h2>This page is reserved to admins!</h2>
      </Alert>
    </div>
  )
}

export default PermissionDenied
