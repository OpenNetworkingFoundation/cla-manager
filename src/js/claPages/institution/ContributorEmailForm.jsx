import React from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

let COUNTER = 0;

/**
 * Form within the institution sign flow. Contains inputs
 * for adding contributor emails.
 */
export default class AddressForm extends React.Component {

  constructor(props) {
    super(props);
    let initialEmails = Object.values(props.formInfo || {}) || [];
    this.state = {
      inputs: initialEmails.map((email, index) => {
        return {
          key: COUNTER++,
          email: email
        };
      })
    };

    this.addNewInput = this.addNewInput.bind(this);
  }

  addNewInput() {
    this.setState(prevState => {
      const inputs = prevState.inputs;
      inputs.push({ key: COUNTER++ });
      return {
        inputs
      };
    });
  }
  
  componentDidMount() {
    this.setState({
      inputs: this.state.inputs.map(inputInfo => {
        return {
          key: inputInfo.key
        };
      })
    });
  }

  render() {
    return (
      <React.Fragment>
        <Typography variant="h6" gutterBottom>
          Contributors
        </Typography>
        <Grid container spacing={3}>
          {
            this.state.inputs.map((inputInfo, index) => {
              return (
                <Grid key={inputInfo.key} item xs={12}>
                  <TextField
                    required
                    name={`contributorEmailAddress${index}`}
                    label="Contributor Email Address"
                    fullWidth
                    value={inputInfo.email}
                  />
                </Grid>
              );
            })
          }
          <Grid item xs={12}>
            <Button onClick={this.addNewInput}>
              Add New Contributor
            </Button>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}
