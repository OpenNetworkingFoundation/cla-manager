import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum, AddendumType } from '../../common/model/addendum'
import MaterialTable from 'material-table'
import MailOutlineIcon from '@material-ui/icons/MailOutline'
import GitHubIcon from '@material-ui/icons/GitHub'
import { Identity, IdentityType } from '../../common/model/identity'
import { Box, Card, Grid, Link, Typography, CardContent, IconButton } from '@material-ui/core'


const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

/**
 * Layout component which renders information about all signed Addendums
 * associated to a given user.
 */

function AddendumsTable (props) {
  const classes = useStyles()
  // If this table has no toJson, no need to show it.
  if (props.data.length === 0) {
    return null
  }

  const cols = [
    {
        title: 'Date Signed',
        sorting: true,
        render: d => {
          return <div>{d.dateSigned.toString()}</div>
        },
        customFilterAndSearch: (query, data) => {
          return data.dateSigned.toString().toLowerCase().indexOf(query.toLowerCase()) > -1
        }
      },
    {
      title: 'Signatory',
      sorting: false,
      render: d => {
        return <div><i>{d.signer.value}</i></div>
      },
      customFilterAndSearch: (query, data) => {
        return data.signer.name.toLowerCase().indexOf(query.toLowerCase()) > -1 || data.signer.value.toLowerCase().indexOf(query.toLowerCase()) > -1
      }
    },
    {
        title: 'Added',
        sorting: false,
        render: d => {
            return (
            <div>          
              {d.added.map(account => 
                <Grid container spacing={1}>
                <Grid item xs={2}>
                  <CardContent>
                    {account.type === IdentityType.GITHUB ? <GitHubIcon fontSize={'small'}/> : null}
                    {account.type === IdentityType.EMAIL ? <MailOutlineIcon fontSize={'small'}/> : null}
                  </CardContent>
                </Grid>
                <Grid item xs={8}>
                  <CardContent>
                    <Typography>
                      {account.value}
                    </Typography>
                  </CardContent>
                </Grid>
                </Grid>
              )}
            </div>
            );
        },
        customFilterAndSearch: (query, data) => {
            return data.added.find(element => element._value.indexOf(query) > -1)
        }
    },
    {
      title: 'Removed',
      sorting: false,
      render: d => {
          return (
          <div>          
            {d.removed.map(account => 
              <Grid container spacing={2}>
              <Grid item xs={2}>
                <CardContent>
                  {account.type === IdentityType.GITHUB ? <GitHubIcon fontSize={'small'}/> : null}
                  {account.type === IdentityType.EMAIL ? <MailOutlineIcon fontSize={'small'}/> : null}
                </CardContent>
              </Grid>
              <Grid item xs={8}>
                <CardContent>
                  <Typography>
                    {account.value}
                  </Typography>
                </CardContent>
              </Grid>
              </Grid>
            )}
          </div>
          );
      },
        customFilterAndSearch: (query, data) => {
            return data.removed.find(element => element._value.indexOf(query) > -1)
        }
    },
  ]

  return (
    <div className={classes.root}>
      <MaterialTable
        columns={cols}
        data={props.data}
        title={props.header}
      />
    </div>
  )
}

AddendumsTable.propTypes = {
  header: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(instanceOf(Addendum)).isRequired,
  type: PropTypes.oneOf(Object.keys(AddendumType).map(i => AddendumType[i])).isRequired
}

export default AddendumsTable
