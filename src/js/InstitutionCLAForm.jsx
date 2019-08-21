import React from 'react';
import Card from '@material-ui/core/Card';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types';
import InstitutionSignFlow from './claPages/institution/InstitutionSignFlow';


/**
 * Form for signing a CLA on behalf of an institution.
 */
class InstitutionCLAForm extends React.Component {
  render() {
    let userEmail;
    if (this.props.user) {
      userEmail = this.props.user.email;
    }

    return (
      <InstitutionSignFlow />
    );
  }
}

InstitutionCLAForm.propTypes = {
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
};

export default InstitutionCLAForm;
