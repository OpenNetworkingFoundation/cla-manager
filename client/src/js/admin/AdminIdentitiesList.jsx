import React, { useEffect, useState } from 'react'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Whitelist } from '../../common/model/whitelists'
import MaterialTable from 'material-table'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

function AdminIdentitiesList (props) {

  const classes = useStyles()
  const [whitelist, setWhitelist] = useState([])

  useEffect(() => {
    Whitelist.list()
      .then(res => {
        const a = res.reduce((list, i) => {
          return [
            ...list,
            ...i.values.map(identity => {
              const [type, value] = identity.split(':')
              return { value, type}
            })
          ]
        }, [])
        setWhitelist(a)
      })
      .catch(console.error) // FIXME handle errors
  }, [])

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>Identities list</h2>
          <p>This page let you see a list of all the existing identities</p>
        </Grid>
        <Grid item xs={12}>
          <MaterialTable
            columns={[
              { title: 'Identity', field: 'value' },
              { title: 'Type', field: 'type' }
            ]}
            data={whitelist}
            title='All existing identities'
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminIdentitiesList
