import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import { Link, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Agreement, AgreementType } from '../../common/model/agreement'
import MaterialTable from 'material-table'
import PatchedPagination from '../helpers/Table'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

/**
 * Layout component which renders information about all signed agreements
 * associated to a given user.
 */

function AgreementsTable (props) {
  const classes = useStyles()
  // If this table has no toJson, no need to show it.
  if (props.data.length === 0) {
    return null
  }

  let cols = [
    // { title: 'Organization', field: 'organization' },
    // { title: 'Signatory Name', field: 'signer.name' },
    // { title: 'Signatory Email', field: 'signer.value' },
    {
      title: 'Signatory',
      sorting: false,
      render: d => {
        return <div>{d.signer.name} <br/> <i>{d.signer.value}</i></div>
      },
      customFilterAndSearch: (query, data) => {
        return data.signer.name.indexOf(query) > -1 || data.signer.value.indexOf(query) > -1
      }
    },
    { title: 'Date Signed', field: 'dateSigned', type: 'date'},
    {
      title: 'Actions',
      sorting: false,
      searchable: false,
      render: d => {
        return <Link href={`/view/${d.id}`}>
          <Button variant='outlined' color='primary' size='small'>View/Edit</Button>
        </Link>
      }
    }
  ]

  // If there are extra columns, append them to the table, before the actions column
  if (props.extra_cols) {
    const element = cols[2]
    cols = [...cols, ...props.extra_cols]
    cols.push(cols.splice(cols.indexOf(element), 1)[0]);
  }

  return (
    <div className={classes.root}>
      <MaterialTable
        columns={cols}
        data={props.data}
        title={props.header}
        components={{
          Pagination: PatchedPagination,
        }}
      />
    </div>
  )
}

AgreementsTable.propTypes = {
  header: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(instanceOf(Agreement)).isRequired,
  type: PropTypes.oneOf(Object.keys(AgreementType).map(i => AgreementType[i])).isRequired
}

export default AgreementsTable
