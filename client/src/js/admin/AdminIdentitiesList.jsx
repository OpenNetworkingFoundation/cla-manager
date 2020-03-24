import React, { useEffect, useState } from 'react'
import { Button, Grid, Link, Paper } from '@material-ui/core'
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
    Whitelist.getWhitelistWithAgreementId()
      .then(res => {
        setWhitelist(res)
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
              { title: 'Identity', field: 'identityValue' },
              {
                title: 'Agreement',
                render: d => {
                  return <Link href={`/view/${d.agreementId}`}>
                    <Button variant='outlined' color='primary'>View Agreement</Button>
                  </Link>
                }
              }
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
