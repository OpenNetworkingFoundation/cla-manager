import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Paper } from '@material-ui/core'
import { AppUser } from '../../common/model/appUser'
import MaterialTable from 'material-table'
import GitHubIcon from '@material-ui/icons/GitHub'
import MailOutlineIcon from '@material-ui/icons/MailOutline'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

function AdminLinkedAccountList (props) {
  const classes = useStyles()
  const [accounts, setAccounts] = useState([])

  React.useEffect(() => {
    AppUser.listAllAccounts().then(res => {
      console.log(res)
      setAccounts(res)
    })
      .catch(console.error)
  }, [])

  const renderIcon = (data) => {
    if (data.hostname === 'github.com') {
      return <GitHubIcon fontSize={'large'}/>
    } else if (data.hostname === 'opennetworking.org') {
      return <MailOutlineIcon fontSize={'large'}/>
    }
  }

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>Linked Accounts list</h2>
          <p>This page let you see a list of all the linked accounts</p>
        </Grid>
        <Grid item xs={12}>
          <MaterialTable
            columns={[
              {
                title: 'Type',
                render: renderIcon,
                sorting: false,
                customFilterAndSearch: (query, data) => {
                  return data.hostname.indexOf(query) > -1
                }
              },
              { title: 'Hostname', field: 'hostname' },
              { title: 'Username', field: 'username' },
            ]}
            data={accounts}
            title='All linked accounts'
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminLinkedAccountList
