import React, { useState } from 'react'
import { Button, Grid, Link, Paper, Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Whitelist } from '../../common/model/whitelists'
import MaterialTable from 'material-table'
import { IdentityType } from '../../common/model/identity'
import GitHubIcon from '@material-ui/icons/GitHub'
import MailOutlineIcon from '@material-ui/icons/MailOutline'
import PatchedPagination from '../helpers/Table'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

function AdminIdentitiesList (props) {
  const classes = useStyles()
  const [whitelist, setWhitelist] = useState([])

  const renderIcon = (data) => {
    if (data.type === IdentityType.GITHUB) {
      return <GitHubIcon fontSize={'large'}/>
    } else if (data.type === IdentityType.EMAIL) {
      return <MailOutlineIcon fontSize={'large'}/>
    }
  }
  
  React.useEffect(() => {
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
              {
                title: 'Type',
                render: renderIcon,
                sorting: false,
                customFilterAndSearch: (query, data) => {
                  return data.type.indexOf(query) > -1
                }
              },
              // { title: '', field: 'type' },
              { title: 'Identity', field: 'identity' },
              {
                title: 'Agreement',
                sorting: false,
                searchable: false,
                render: d => {
                  return d.agreements.map(id => {
                    return <Box key={id} className={classes.root}>
                      <Link href={`/view/${id}`}>
                        <Button variant='outlined' color='primary'>View Agreement</Button>
                      </Link>
                    </Box>
                  })
                }
              }
            ]}
            data={whitelist}
            title='All existing identities'
            components={{
              Pagination: PatchedPagination,
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminIdentitiesList
