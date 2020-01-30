import React from 'react'
import Grid from '@material-ui/core/Grid'
import PropTypes from 'prop-types'

import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
// import TextField from '@material-ui/core/TextField';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import Checkbox from '@material-ui/core/Checkbox';
import { TextValidator } from 'react-material-ui-form-validator'

/**
 * Form within the institution sign flow. Contains inputs
 * for adding contributor emails.
 */
export default class AddressForm extends React.Component {
  constructor (props) {
    super(props)
    // Extract the keys from existing form info
    const keys = Object.keys(this.props.formInfo)
      .filter(k => k.startsWith('name'))
      .map(k => k.split('-')[1])
      .sort()
    this.state = {
      keys
    }
    this.addNewInput = this.addNewInput.bind(this)
  }

  addNewInput (e) {
    const fakeEvent = {
      target: {
        value: ''
      }
    }
    const newIndex = this.state.keys.slice(-1)[0] + 1 || 0
    fakeEvent.target.name = 'name-' + newIndex
    this.props.handleChange(fakeEvent)
    fakeEvent.target.name = 'email-' + newIndex
    this.props.handleChange(fakeEvent)
    this.setState({ keys: [...this.state.keys, newIndex] })
  }

  render () {
    return (
      <>
        <Typography variant='h5' gutterBottom>
          Schedule A
        </Typography>
        <Typography variant='h6' gutterBottom>
          Contributors
        </Typography>
        <Typography variant='body1'>
          <i>Initial list of designated employees.  NB: authorization is not tied to particular Contributions.</i>
        </Typography>
        <Grid container spacing={3}>
          {
            this.state.keys.map(index => {
              return (
                // <Grid key={inputInfo.key} item xs={12}>
                <Grid key={index} item xs={12}>
                  {/* <TextField
                    required
                    name={`contributorEmailAddress${index}`}
                    label="Contributor Email Address"
                    fullWidth
                    value={inputInfo.email}
                  /> */}
                  <TextValidator
                    label='Full Name'
                    name={'name-' + index}
                    value={this.props.formInfo['name-' + index]}
                    onChange={this.props.handleChange}
                    validators={['required']}
                    errorMessages={['You must enter a name']}
                  />
                  <TextValidator
                    label='Email'
                    name={'email-' + index}
                    value={this.props.formInfo['email-' + index]}
                    onChange={this.props.handleChange}
                    validators={['required', 'isEmail']}
                    errorMessages={['You must enter an email', 'Email is not valid']}
                  />
                </Grid>
              )
            })
          }
          <Grid item xs={12}>
            <Button onClick={this.addNewInput}>
              Add New Contributor
            </Button>
          </Grid>
        </Grid>
      </>
    )
  }
}

AddressForm.propTypes = {
  formInfo: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired
}
