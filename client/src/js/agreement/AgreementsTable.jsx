import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import { Link, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Agreement, AgreementType } from '../../common/model/agreement'
import MaterialTable from 'material-table'

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

  const cols = [
    { title: 'Organization', field: 'organization' },
    { title: 'Signatory Name', field: 'signer.name' },
    { title: 'Signatory Email', field: 'signer.value' },
    { title: 'Date Signed', field: 'dateSigned', type: 'date' },
    {
      title: 'Actions',
      render: d => {
        return <Link href={`/view/${d.id}`}>
          <Button variant='outlined' color='primary'>View/Edit</Button>
        </Link>
      }
    }
  ]

  if (props.type === AgreementType.INDIVIDUAL) {
    // remove the org name if we're printing individual CLAs
    cols.shift()
  }

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

AgreementsTable.propTypes = {
  header: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(instanceOf(Agreement)).isRequired,
  type: PropTypes.oneOf(Object.keys(AgreementType).map(i => AgreementType[i])).isRequired
}

export default AgreementsTable
