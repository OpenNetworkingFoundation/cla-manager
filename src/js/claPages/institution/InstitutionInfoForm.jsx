import React from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/app';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { TextValidator} from 'react-material-ui-form-validator';

function initializeForm(formInfo, handleChange) {
  let fakeEvent = {
    target: {
      value: ''
    }
  };

  let checkField = fieldName => {
    if (formInfo[fieldName] === undefined) {
      fakeEvent.target.name = fieldName;
      handleChange(fakeEvent);
    }
  }

  checkField('institutionName');
  checkField('yourName');
  checkField('yourTitle');
  checkField('institutionAddress');
}

export default function InstitutionInfoForm(props) {
  const formInfo = props.formInfo;
  const handleChange = props.handleChange;
  const email = firebase.auth().currentUser.email;
  initializeForm(formInfo, handleChange);
  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        Institution Info 
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextValidator
            required
            // id="institutionName"
            name="institutionName"
            label="Institution Name"
            fullWidth
            // autoComplete="iname"
            value={formInfo.institutionName}
            onChange={handleChange}
            validators={['required']}
            errorMessages={['You must enter a name']}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextValidator
            required
            // id="yourName"
            name="yourName"
            label="Your Name"
            fullWidth
            // autoComplete="yname"
            value={formInfo.yourName}
            onChange={handleChange}
            validators={['required']}
            errorMessages={['You must enter a name']}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextValidator
            required
            // id="yourTitle"
            name="yourTitle"
            label="Your Title"
            fullWidth
            // autoComplete="ytitle"
            value={formInfo.yourTitle}
            onChange={handleChange}
            validators={['required']}
            errorMessages={['You must enter a name']}
          />
        </Grid>
        <p>Email: <span id="display-email">{email}</span></p>
        <Grid item xs={12}>
          <TextValidator
            required
            // id="institutionAddress"
            name="institutionAddress"
            label="Institution Address"
            fullWidth
            // autoComplete="iaddress"
            value={formInfo.institutionAddress}
            onChange={handleChange}
            validators={['required']}
            errorMessages={['You must enter a name']}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">
            Primary Contact
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="primaryContactName"
            name="primaryContactName"
            label="Name"
            fullWidth
            autoComplete="pcontactname"
            value={formInfo.primaryContactName}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="primaryContactEmail"
            name="primaryContactEmail"
            label="Email"
            fullWidth
            autoComplete="pcontactemail"
            value={formInfo.primaryContactEmail}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="primaryContactPhone"
            name="primaryContactPhone"
            label="Phone"
            fullWidth
            autoComplete="pcontactphone"
            value={formInfo.primaryContactPhone}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">
            Secondary Contact
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="secondaryContactName"
            name="secondaryContactName"
            label="Name"
            fullWidth
            autoComplete="scontactname"
            value={formInfo.secondaryContactName}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="secondaryContactEmail"
            name="secondaryContactEmail"
            label="Email"
            fullWidth
            autoComplete="scontactemail"
            value={formInfo.secondaryContactEmail}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="secondaryContactPhone"
            name="secondaryContactPhone"
            label="Phone"
            fullWidth
            autoComplete="scontactphone"
            value={formInfo.secondaryContactPhone}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}

InstitutionInfoForm.propTypes = {
  formInfo: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
};