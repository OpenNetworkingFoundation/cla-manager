import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator'
import Button from '@material-ui/core/Button'
import AgreementDisplay from './AgreementDisplay'
import AddendumContainer from '../addendum/AddendumContainer'
import { FirebaseApp } from '../../common/app/app'
import { Agreement, AgreementType } from '../../common/model/agreement'
import { Alert, Skeleton } from '@material-ui/lab'
import { useHistory } from 'react-router-dom'
import { Identity, IdentityType } from '../../common/model/identity'
import { ClaTextCorporate, ClaTextIndividual } from '../cla/ClaText'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  },
  skeleton: {
    backgroundColor: theme.palette.grey['400']
  },
  formField: {
    marginBottom: theme.spacing(2)
  }
}))

/**
 * Component which displays an Agreement, both for creation and update.
 */
function AgreementContainer (props) {
  const history = useHistory()
  const agreementId = props.agreementId

  const classes = useStyles()

  // component state
  const [error, setError] = useState(null)
  const [agreement, setAgreement] = useState({})
  const [loader, setLoading] = useState(agreementId !== undefined)

  // form values
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [orgAddress, setOrgAddress] = useState('')

  useEffect(() => {
    if (props.agreementId) {
      // if there is an agreementId, go and download it
      Agreement.get(props.agreementId)
        .then(res => {
          setAgreement(res)
          setLoading(false)
        })
        .catch(console.error)
    } else {
      // set a default text
      if (props.agreementType === AgreementType.CORPORATE) {
        setAgreement({ body: ClaTextCorporate })
      } else if (props.agreementType === AgreementType.INDIVIDUAL) {
        setAgreement({ body: ClaTextIndividual })
      }
    }
  }, [props.agreementType, props.agreementId])

  let organizationTextValidator = null

  if (props.agreementType === AgreementType.CORPORATE) {
    organizationTextValidator = (
      <div>
        <TextValidator
          fullWidth
          label='Phone Number'
          name='phoneNumber'
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          validators={['required', 'matchRegexp:^[0-9]+$']}
          errorMessages={['You must enter the company phone number', 'Please enter numbers only']}
          variant='outlined'
          className={classes.formField}
        />
        <TextValidator
          fullWidth
          label='Title'
          name='signerTitle'
          value={signerTitle}
          onChange={e => setSignerTitle(e.target.value)}
          validators={['required']}
          errorMessages={['You must enter the company title']}
          variant='outlined'
          className={classes.formField}
        />
        <TextValidator
          fullWidth
          label='Organization Name'
          name='orgName'
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          validators={['required']}
          errorMessages={['You must enter the company name']}
          variant='outlined'
          className={classes.formField}
        />
        <TextValidator
          fullWidth
          label='Organization Address'
          name='orgAddress'
          value={orgAddress}
          onChange={e => setOrgAddress(e.target.value)}
          validators={['required']}
          errorMessages={['You must enter the company address']}
          variant='outlined'
          className={classes.formField}
        />

      </div>
    )
  }

  const handleSubmit = (evt) => {
    evt.preventDefault()

    const signer = new Identity(
      IdentityType.EMAIL,
      name,
      FirebaseApp.auth().currentUser.email
    )

    signer.title = signerTitle
    signer.phoneNumber = phoneNumber

    let agreement = null

    if (props.agreementType === AgreementType.INDIVIDUAL) {
      agreement = new Agreement(
        AgreementType.INDIVIDUAL,
        ClaTextIndividual,
        signer
      )
    } else if (props.agreementType === AgreementType.CORPORATE) {
      agreement = new Agreement(
        AgreementType.CORPORATE,
        ClaTextCorporate,
        signer,
        orgName,
        orgAddress
      )
    }

    agreement.save()
      .then(res => {
        history.push(`/view/${res.id}`)
      })
      .catch(err => {
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
        <Grid item xs={12} md={10}>
          <TextValidator
            fullWidth
            label='Full Name'
            name='name'
            value={name}
            onChange={e => setName(e.target.value)}
            validators={['required']}
            errorMessages={['You must enter your name']}
            variant='outlined'
            className={classes.formField}
          />
          {organizationTextValidator}
        </Grid>
        <Grid item xs={12} md={2}>
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
    <div>
      {loader ?
        <Paper elevation={23} className={classes.root}>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='circle' width={40} height={40}/>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='rect' width={'100%'} height={118}/>
        </Paper>
        :
        <Paper elevation={23} className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <AgreementDisplay text={agreement.body}/>
            </Grid>
          </Grid>
          {agreementId ? null : form}
          {agreementId ? <AddendumContainer user={props.user} agreementId={agreementId}/> : null}
        </Paper>
      }
    </div>
  )
}

AgreementContainer.propTypes = {
  user: PropTypes.object.isRequired,
  agreementType: PropTypes.string,
  agreementId: PropTypes.string
}

export default AgreementContainer
