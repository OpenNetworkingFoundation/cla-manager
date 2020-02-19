import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator'
import Button from '@material-ui/core/Button'
import AgreementDisplay from './AgreementDisplay'
import AddendumContainer from '../addendum/AddendumContainer'
import { Agreement, AgreementType } from '../../common/model/agreement'
import { Alert, Skeleton } from '@material-ui/lab'
import { useHistory } from 'react-router-dom'
import { Identity, IdentityType } from '../../common/model/identity'
import { ClaTextCorporate, ClaTextIndividual } from '../cla/ClaText'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemText from '@material-ui/core/ListItemText'
import Avatar from '@material-ui/core/Avatar'
import ReceiptIcon from '@material-ui/icons/Receipt'
import TextField from '@material-ui/core/TextField'

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
  const [agreement, setAgreement] = useState({ body: '' })
  const [loader, setLoading] = useState(agreementId !== undefined)

  // form values
  const [signerName, setName] = useState('')
  const [signerEmail, setSignerEmail] = useState(props.user.email)
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
          setName(res.signer.name)
          setSignerEmail(res.signer.value)
          if (res.type === AgreementType.CORPORATE) {
            setOrgName(res.organization)
            setOrgAddress(res.organizationAddress)
            setSignerTitle(res.signer.title)
            setPhoneNumber(res.signer.phoneNumber)
          }
          setLoading(false)
        })
        .catch(console.error)
    } else {
      if (props.agreementType === AgreementType.CORPORATE) {
        setAgreement({
          type: AgreementType.CORPORATE,
          body: ClaTextCorporate
        })
      } else if (props.agreementType === AgreementType.INDIVIDUAL) {
        setAgreement({
          type: AgreementType.INDIVIDUAL,
          body: ClaTextIndividual
        })
      }
    }
  }, [props.agreementType, props.agreementId])

  const handleSubmit = (evt) => {
    evt.preventDefault()

    const signer = new Identity(
      IdentityType.EMAIL,
      signerName,
      signerEmail
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

  const ifCorporate = (value, otherwise) => {
    return agreement.type === AgreementType.CORPORATE ? value : otherwise
  }

  const ifSigned = (value = true, otherwise = false) => {
    return agreement.id ? value : otherwise
  }

  // NOTE consider moving in a different component
  const form = (
    <ValidatorForm
      onSubmit={ifSigned(() => {}, handleSubmit)}
      onError={errors => console.log(errors)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {error ? <Alert severity='error'>{error}</Alert> : null}
        </Grid>
        <Grid item xs={12}>
          <Box component='div' display={ifSigned('', 'none')}>
            <TextField
              fullWidth
              InputProps={{
                readOnly: true
              }}
              label='Date Signed'
              name='dateSigned'
              value={agreement.dateSigned}
              variant='outlined'
              className={classes.formField}
            />
          </Box>
          <TextValidator
            fullWidth
            InputProps={{
              readOnly: ifSigned()
            }}
            label='Signer Full Name'
            name='signerName'
            value={signerName}
            onChange={e => setName(e.target.value)}
            validators={['required']}
            errorMessages={['You must enter your full name']}
            variant='outlined'
            className={classes.formField}
          />
          <TextValidator
            fullWidth
            InputProps={{
              readOnly: true
            }}
            label='Signer Email Address'
            name='signerEmail'
            value={signerEmail}
            validators={['required']}
            errorMessages={['You must enter your email address']}
            variant='outlined'
            className={classes.formField}
          />
          <Box
            component='div'
            display={ifCorporate('', 'none')}
          >
            <TextValidator
              fullWidth
              InputProps={{
                readOnly: ifSigned()
              }}
              label='Signer Title'
              name='signerTitle'
              value={signerTitle}
              onChange={e => setSignerTitle(e.target.value)}
              validators={ifCorporate(['required'], [])}
              errorMessages={['You must enter your title']}
              variant='outlined'
              className={classes.formField}
            />
            <TextValidator
              fullWidth
              InputProps={{
                readOnly: ifSigned()
              }}
              label='Signer Phone Number'
              name='phoneNumber'
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              validators={ifCorporate(['required'], [])}
              errorMessages={['You must enter your phone number']}
              variant='outlined'
              className={classes.formField}
            />
            <TextValidator
              fullWidth
              InputProps={{
                readOnly: ifSigned()
              }}
              label='Organization Name'
              name='orgName'
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              validators={ifCorporate(['required'], [])}
              errorMessages={['You must enter the company name']}
              variant='outlined'
              className={classes.formField}
            />
            <TextValidator
              fullWidth
              InputProps={{
                readOnly: ifSigned()
              }}
              label='Organization Address'
              name='orgAddress'
              value={orgAddress}
              onChange={e => setOrgAddress(e.target.value)}
              validators={ifCorporate(['required'], [])}
              errorMessages={['You must enter the company address']}
              variant='outlined'
              className={classes.formField}
            />
          </Box>
          <Box component='div' display={ifSigned('none', '')}>
            <Button
              fullWidth
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

  const agreementHeader = (
    <List className={classes.root}>
      <ListItem>
        <ListItemAvatar>
          <Avatar>
            <ReceiptIcon/>
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Agreement ID" secondary={agreement.id}/>
      </ListItem>
    </List>
  )

  return (
    <div>
      {loader
        ? <Paper elevation={23} className={classes.root}>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='circle' width={40} height={40}/>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='rect' width={'100%'} height={118}/>
        </Paper>
        : <Paper elevation={23} className={classes.root}>
          <Grid container spacing={2}>
            {ifSigned(agreementHeader, null)}
            <Grid item xs={12}>
              <AgreementDisplay text={agreement.body}/>
            </Grid>
          </Grid>
          {form}
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
