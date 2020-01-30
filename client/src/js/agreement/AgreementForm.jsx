import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator'
import Button from '@material-ui/core/Button'
import AgreementDisplay from './AgreementDisplay'
import AddendumContainer from '../addendum/AddendumContainer'
import { FirebaseApp } from '../../common/app/app'
import { User } from '../../common/model/user'
import { Agreement, AgreementType } from '../../common/model/agreement'
import Alert from '@material-ui/lab/Alert'
import { useHistory } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

/**
 * Component which displays an Agreement, both for creation and update.
 */
function AgreementForm (props) {
  const history = useHistory()
  const agreementId = props.agreementId

  // TODO if props.agreementId is set, load an existing agreement

  const classes = useStyles()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (evt) => {
    evt.preventDefault()
    console.log('Name used:', name)
    console.log(props.agreementType)
    // TODO save model
    // TODO after save send to view/<agreementId>

    const signer = new User(
      name,
      FirebaseApp.auth().currentUser.email
    )

    const agreement = new Agreement(
      AgreementType.INDIVIDUAL,
      'TODO, add agreement body',
      signer
    )

    agreement.save()
      .then(res => {
        history.push(`/view/${res.id}`)
      })
      .catch(err => {
        console.error(err)
        if (err.code === 'permission-denied') {
          setError('Permission denied, please try again later')
          return
        }
        setError('Request failed, please try again later')
      })
  }

  // NOTE consider moving in a different component
  const form = (
    <ValidatorForm onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {error ? <Alert severity='error'>{error}</Alert> : null}
        </Grid>
        <Grid item xs={12} md={6}>
          <TextValidator
            fullWidth
            label='Full Name'
            name='name'
            value={name}
            onChange={e => setName(e.target.value)}
            validators={['required']}
            errorMessages={['You must enter your name']}
            variant='outlined'
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box textAlign='right' m={1}>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              size='large'
            >Sign Agreement
            </Button>
          </Box>
        </Grid>
      </Grid>

    </ValidatorForm>)

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>AgreementForm</h2>
          <AgreementDisplay />
        </Grid>
      </Grid>
      {agreementId ? null : form}
      {agreementId ? <AddendumContainer user={props.user} agreementId={agreementId} /> : null}
    </Paper>
  )
}

AgreementForm.propTypes = {
  user: PropTypes.object.isRequired,
  agreementType: PropTypes.string,
  agreementId: PropTypes.string
}

export default AgreementForm
