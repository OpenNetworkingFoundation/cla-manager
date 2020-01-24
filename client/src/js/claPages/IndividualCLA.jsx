import React from 'react';
import {FirebaseApp} from '../../common/app/app';

import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import { ValidatorForm, TextValidator} from 'react-material-ui-form-validator';

import {Agreement, AgreementType} from '../../common/model/agreement'

/**
 * Component which displays an individual CLA.
 */
class IndividualCLA extends React.Component {

  state = {
    name: '',
    email: FirebaseApp.auth().currentUser.email,
    formEnabled: true,
    error: null
  }
  
  handleSubmit = (event) => {
    if(!this.state.formEnabled) {
      console.error("submit blocked due to outstanding request")
      return;
    }
    const email = this.state.email;
    const name = this.state.name;
    if(!email || !name) {
      // TODO handle this is in the HTML, not with an alert
      alert("invalid email or name");
      return;
    }
    
    this.setState({formEnabled: false})

    // TODO this needs to be a User
    const signer = {
      "name": name,
      "email": email,
    }

    const agreement = new Agreement(
      AgreementType.INDIVIDUAL,
      "TODO, add agreement body",
      signer
    )
    console.log(this.state.email)
    agreement.save()
    .then(res => {
      window.location.href = "/";
    })
    .catch(err => {
        if (err.code === "permission-denied") {
          this.setState({formEnabled: true, error: 'Permission denied, please try again later'})  
          return
        }
        this.setState({formEnabled: true, error: 'Request failed, please try again later'})
    })
  }

  handleChange = (event) => {
    const name = event.target.value;
    this.setState({ name });
  }

  render() {
    // const classes = useStyles();
    const { name, email, formEnabled, error } = this.state;

    return (
      <div>
      <p style={{textAlign: "center"}}><b>Open Networking Foundation</b><br />
        <b>Open Networking Individual Contributor License Agreement ("Agreement")</b></p>
      <p>Thank you for your interest in the Open Networking Project being conducted by Open Networking Foundation (“<b><i>ONF</i></b>”). &nbsp;The “<b><i>Project</i></b>” consists of activities relating to the Open Network Operating System (“<b><i>ONOS</i></b>”), the Central Office Re-architected as a Datacenter (“<b><i>CORD</i></b>”), and other initiatives undertaken by ON.Lab and ONF which are synergistic with ONOS or CORD.&nbsp; The Project was previously conducted by Open Networking Laboratory (“<b><i>ON.Lab</i></b>”).</p>
      <p>In order to clarify the intellectual property license granted with Contributions from any person or entity to the Project, ONF must have a Contributor License Agreement (“<b><i>CLA”</i></b>) on file that has been signed by each Contributor, indicating agreement to the license terms below. This license is for your protection as a Contributor as well as the protection of ONF and its users; it does not change your rights to use your own Contributions for any other purpose.</p>
      <p>You accept and agree to the following terms and conditions for Your past Contributions submitted to ON.Lab and present and future Contributions submitted to ONF for the Project. Except for the license granted herein to ONF and recipients of software distributed by ONF, You reserve all right, title, and interest in and to Your Contributions.
      </p>
      <p>1. <b>Definitions</b>.</p>
      <p>"<b><i>You</i></b>" (or "<b><i>Your</i></b>") shall mean the copyright owner or legal entity authorized by the copyright owner that is making this Agreement with ONF. For legal entities, the entity making a Contribution and all other entities that control, are controlled by, or are under common control with that entity are considered to be a single “<b><i>Contributor</i></b>.” For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.</p>
      <p>"<b><i>Contribution</i></b>" shall mean the code, documentation or other works of authorship, including any modifications or additions to an existing work, that are intentionally submitted by You to ONF or to ON.Lab for inclusion in, or documentation of, (a) the ONOS software or use cases, (b) the CORD software stack or use cases, or (c) projects undertaken by ONF which are synergistic with ONOS or CORD, and all developments related to the foregoing, being created by ONF, ON.Lab and/or their Contributors (the "<b><i>Work</i></b>"). For the purposes of this definition, "<b><i>submitted</i></b>" means any form of electronic, verbal, or written communication sent to ON.Lab, ONF or their representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, ON.Lab or ONF for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by You as "Not a Contribution."</p>
      <p>2. <b>Grant of Copyright License</b>. Subject to the terms and conditions of this Agreement, You hereby grant to ONF and to recipients of software distributed by ONF or ON.Lab a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute Your Contributions and such derivative works.</p>
      <p>3. <b>Grant of Patent License</b>. Subject to the terms and conditions of this Agreement, You hereby grant to ONF and to recipients of software distributed by ONF or ON.Lab a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by You that are necessarily infringed by Your Contribution(s) alone or by combination of Your Contribution(s) with the Work to which such Contribution(s) were submitted. If any entity institutes patent litigation against You or any other entity (including a cross-claim or counterclaim in a lawsuit) alleging that Your Contribution, or the Work to which You have contributed, constitutes direct or contributory patent infringement, then any patent licenses granted to that entity under this Agreement for that Contribution or Work shall terminate as of the date such litigation is filed.</p>
      <p>4. <b>Right to Grant Licenses. </b>You represent that You are legally entitled to grant the above licenses. &nbsp;If your employer(s) has (have) rights to intellectual property that you create that includes your Contributions, you represent that you have received permission to make Contributions on behalf of that employer, that your employer has waived such rights for your Contributions to ON.Lab and ONF, or that your employer has executed a separate Corporate CLA with ONF.</p>
      <p>5. <b>Original Creation.&nbsp; </b>You represent that each of Your Contributions is Your original creation (see section 7 for submissions on behalf of others).&nbsp; You represent that Your Contribution submissions include complete details of any third-party license or other restriction (including, but not limited to, related patents and trademarks) of which you are personally aware and which are associated with any part of Your Contributions.</p>
      <p>6. <b>Support; Warranty Disclaimer.&nbsp; </b>You are not expected to provide support for Your Contributions, except to the extent You desire to provide support. You may provide support for free, for a fee, or not at all. Unless required by applicable law or agreed to in writing, You provide Your Contributions on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE.</p>
      <p>7. <b>Contributions That Are Not Your Original Creation.&nbsp; </b>Should You wish to submit work that is not Your original creation, You may submit it to ONF separately from any Contribution, identifying the complete details of its source and of any license or other restriction (including, but not limited to, related patents, trademarks, and license agreements) of which you are personally aware, and conspicuously marking the work as "Submitted on behalf of a third-party: [named here]".</p>
      <p>8. <b>Required Notifications. </b>You agree to notify ONF of any facts or circumstances of which you become aware that would make these representations inaccurate in any respect.</p>
     
      <div style={{textAlign: 'center'}}>
        <ValidatorForm
          style={{display: 'inline-block'}}
          ref="form"
          onSubmit={this.handleSubmit}
          onError={errors => console.log(errors)}
        >
          { this.state.error ? <Alert severity="error">{error}</Alert> : null }
          <TextValidator
              style={{width: '100%'}}
              label="Full Name"
              name="name"
              value={name}
              onChange={this.handleChange}
              validators={['required']}
              errorMessages={['You must enter your name']}
              margin="normal"
              variant="outlined"
              disabled={!formEnabled}
          />
          <p>Email: <span id="display-email">{email}</span></p>
          <Button type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!formEnabled}
          >I AGREE</Button>
        </ValidatorForm>
      </div>
      </div>
    );
  }
}

export default IndividualCLA;
