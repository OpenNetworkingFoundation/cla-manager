import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

export default function InstitutionInfoForm() {
  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        Institution Info 
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="institutionName"
            name="institutionName"
            label="Institution Name"
            fullWidth
            autoComplete="iname"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="yourName"
            name="yourName"
            label="Your Name"
            fullWidth
            autoComplete="yname"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="yourTitle"
            name="yourTitle"
            label="Your Title"
            fullWidth
            autoComplete="ytitle"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="institutionAddress"
            name="institutionAddress"
            label="Institution Address"
            fullWidth
            autoComplete="iaddress"
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
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="secondaryContactEmail"
            name="secondaryContactEmail"
            label="Email"
            fullWidth
            autoComplete="scontactemail"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="secondaryContactPhone"
            name="secondaryContactPhone"
            label="Phone"
            fullWidth
            autoComplete="scontactphone"
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
