import React from 'react'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

function AdminIdentitiesList (props) {

  const classes = useStyles()

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>Identities list</h2>
          <p>This page let you see a list of all the existing identities</p>
        </Grid>
        <Grid item xs={12}>
          <h2>Coming soon</h2>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminIdentitiesList
