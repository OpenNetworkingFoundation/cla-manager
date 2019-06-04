import React from 'react';
import Main from './Main';
import Header from './Header';

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
      <Card>
        <form onSubmit={this.props.onSubmit}>
          <Input type="text" id="institution-name" placeholder="Institution Name"/>
          <Input type="text" id="institution-address" placeholder="Institution Address"/>
          <Input type="text" id="primary-name" placeholder="Primary Contact Name"/>
          <Input type="text" id="primary-email" placeholder="Primary Contact Email"/>
          <Input type="text" id="primary-phone" placeholder="Primary Contact Phone"/>
          <Input type="text" id="secondary-name" placeholder="Secondary Contact Name (Optional)"/>
          <Input type="text" id="secondary-email" placeholder="Secondary Contact Email"/>
          <Input type="text" id="secondary-phone" placeholder="Secondary Contact Phone"/>
          <Input type="text" id="signer-name" placeholder="Your Name"/>
          <Input type="text" id="signer-title" placeholder="Your Title"/>
          <p>Your Email: <span id="display-email2"/>{userEmail}</p>
          <Input type="submit" id="institutional-cla-accept" name="accept">I ACCEPT</Input>
        </form>
      </Card>
    );
  }
}

InstitutionCLAForm.propTypes = {
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
};

export default InstitutionCLAForm;
