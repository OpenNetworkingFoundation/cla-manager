import React from 'react'
import PropTypes from 'prop-types'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import { Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

/**
 * Layout component which renders information about all signed agreements
 * associated to a given user.
 */

function AgreementsContainer (props) {
  const classes = useStyles()
  // If this table has no toJson, no need to show it.
  if (props.data.length === 0) {
    return null
  }

  return (
    <Paper elevation={23} className={classes.root}>
      <h4>{props.header}</h4>
      <p>{props.description}</p>
      <Table>
        <TableHead>
          <TableRow>
            {props.columnTitles.map(t => <TableCell key={t}>{t}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>{
          props.data.map(r => (
            <TableRow key={r.id + '-row'}>
              {props.columnIds.map((n, i) => {
                // Enable screen readers to identify a cell's value by it's row and column name
                const attrs = i !== 0 ? {} : {
                  component: 'th',
                  scope: 'row'
                }
                return <TableCell key={`${r.id}-${n}`} {...attrs}>{r[n]}</TableCell>
              })}
            </TableRow>
          ))
        }
        </TableBody>
      </Table>
    </Paper>
  )
}

AgreementsContainer.propTypes = {
  header: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  columnTitles: PropTypes.arrayOf(PropTypes.string).isRequired,
  columnIds: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default AgreementsContainer
