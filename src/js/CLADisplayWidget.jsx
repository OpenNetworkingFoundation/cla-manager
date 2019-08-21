import React from 'react';
import IndividualCLA from './IndividualCLA';
import InstitutionCLAForm from './InstitutionCLAForm';
import PropTypes from 'prop-types';

/**
 * Layout component for displaying a CLA plus an input form to sign the CLA.
 * TODO would be nice to make this an expansion panel: https://material-ui.com/demos/expansion-panels/
 */
class CLADisplayWidget extends React.Component {
  render() {
    let cla;
    if (this.props.type === 'individual') {
      cla = <IndividualCLA user={this.props.user} />;
    }
    else if (this.props.type === 'institution') {
      cla = <InstitutionCLAForm user={this.props.user} onSubmit={this.props.onSubmit}/>;
    }

    return (
      <div id="cla-widget">
        {cla}
      </div>
    );
  }
}

CLADisplayWidget.propTypes = {
  type: PropTypes.string.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func//.isRequired
};

export default CLADisplayWidget;
