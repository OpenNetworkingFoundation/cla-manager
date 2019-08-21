import React from 'react';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';

/**
 * Layout component which renders information about all signed agreements
 * associated to a given user.
 */

class AgreementsContainer extends React.Component {
  render() {
    // If this table has no data, no need to show it.
    if (this.props.data.length === 0) {
      return null;
    }

    return (
      <React.Fragment>
        <h4>{this.props.header}</h4>
        <p>{this.props.description}</p>
        <Table>
          <TableHead>
            <TableRow>
              {this.props.columnTitles.map(t => <TableCell key={t}>{t}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>{
            this.props.data.map(r => (
              <TableRow key={r.id + '-row'}>
                {this.props.columnIds.map((n, i) => {
                  // Enable screen readers to identify a cell's value by it's row and column name
                  const attrs = i !== 0 ? {} : {
                    component: 'th',
                    scope: 'row',
                  }
                  return <TableCell key={`${r.id}-${n}`} {...attrs}>{r[n]}</TableCell>
                })
                }
              </TableRow>
            ))
          }</TableBody>
        </Table>
      </React.Fragment>
    );
  }
}

AgreementsContainer.propTypes = {
  header: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  columnTitles: PropTypes.arrayOf(PropTypes.string).isRequired,
  columnIds: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default AgreementsContainer;
