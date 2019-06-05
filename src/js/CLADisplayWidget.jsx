import React from 'react';
import PropTypes from 'prop-types';
import IndividualCLAText from './IndividualCLAText';
import InstitutionCLAForm from './InstitutionCLAForm';

/**
 * Layout component for displaying a CLA plus an input form to sign the CLA.
 * TODO would be nice to make this an expansion panel: https://material-ui.com/demos/expansion-panels/
 */
class CLADisplayWidget extends React.Component {
  render() {
    return (
      <div id="individual-cla">
        <div class="mdl-card__supporting-text">
          <IndividualCLAText user={this.props.user} />
          <div class="mdl-textfield mdl-js-textfield">
            <textarea class="mdl-textfield__input" type="text" rows= "3" id="institutional-whitelist" ></textarea>
            <label class="mdl-textfield__label" for="institutional-whitelist">Authorized contributor emails (one per line)...</label>
          </div>

        </div>

        <InstitutionCLAForm
          user={this.props.user}
          onSubmit={this.props.onSubmit}
        />
      </div>
    );
  }
}

CLADisplayWidget.propTypes = {
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
};

export default CLADisplayWidget;
