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
      <div
        class="mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet"
      >
        <h4>{this.props.header}</h4>
        <p>{this.props.description}</p>
        <Table
          class="mdl-data-table mdl-js-data-table mdl-shadow--2dp"
        >
          <TableHead>
            <TableRow>
              {this.props.columnTitles.map(t => <TableCell>{t}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {
              this.props.data.map(r => (
                <TableRow>{r.map(c => <TableCell>{c}</TableCell>)}</TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    );
  }
}

AgreementsContainer.propTypes = {
  header: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  columnTitles: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default AgreementsContainer;
