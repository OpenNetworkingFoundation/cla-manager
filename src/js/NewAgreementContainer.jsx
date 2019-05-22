import React from 'react';
import Button from '@material-ui/core/Button';

/**
 * Input widget which lets a user sign a new agreement.
 */
class NewAgreementContainer extends React.Component {
  render() {
    return (
      <section id="new-agreement-container"
                       class="mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet">
        <h4>Sign a new agreement</h4>
        <p>Who will you be submitting contributions on behalf of?</p>
        <div class="mdl-grid">
          <form method="get" action="/sign.html">
            <input type="hidden" name="kind" value="individual"/>
            <Button variant="contained">Only Yourself</Button>
          </form>
          &nbsp;&nbsp;
          <form method="get" action="/sign.html">
            <input type="hidden" name="kind" value="institutional"/>
            <Button variant="contained">Your Employer</Button>
          </form>
        </div>
      </section>
    );
  }
}

export default NewAgreementContainer;
