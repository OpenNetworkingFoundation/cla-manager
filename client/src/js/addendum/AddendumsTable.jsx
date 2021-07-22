import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum, AddendumType } from '../../common/model/addendum'
import MaterialTable from 'material-table'

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
            return (<div>{d.added.map(account => <div>{account.value}</div>)}</div>);
        },
        customFilterAndSearch: (query, data) => {
            return data.added.find(element => element._value.indexOf(query) > -1)
        }
    },
    {
        title: 'Removed',
        sorting: false,
        render: d => {
            return (<div>{d.removed.map(account => <div>{account.value}</div>)}</div>);
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
