import React from 'react';
import { Link } from "react-router-dom";
import Button from '@material-ui/core/Button';

function signNewAgreement(type) {
  window.location.href = '/sign.html?type=' + type;
}


/**
 * Input widget which lets a user sign a new agreement.
 */
class NewAgreementContainer extends React.Component {

  render() {
    return (
      <section id="new-agreement-container"
                       className="mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet">
        <h4>Sign a new agreement</h4>
        <p>Who will you be submitting contributions on behalf of?</p>
        <div className="mdl-grid">
          <Link to="/sign/individual">
            <Button
              variant="contained"
            >
              Only Yourself
            </Button>
          </Link>
          &nbsp;&nbsp;
          <Link to="/sign/institution">
            <Button
              variant="contained"
            >
              Your Employer
            </Button>
          </Link>
        </div>
      </section>
    );
  }
}

export default NewAgreementContainer;
