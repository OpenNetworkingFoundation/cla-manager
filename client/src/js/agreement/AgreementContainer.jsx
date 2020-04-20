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
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemText from '@material-ui/core/ListItemText'
import Avatar from '@material-ui/core/Avatar'
import ReceiptIcon from '@material-ui/icons/Receipt'
import TextField from '@material-ui/core/TextField'
import { Addendum, AddendumType } from '../../common/model/addendum'
import { GetBugsnagClient } from '../../common/app/app'

const bugsnagClient = GetBugsnagClient()

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

  const classes = useStyles()

  // component state
  const [error, setError] = useState(null)
  const [agreement, setAgreement] = useState({ body: '' })
  const [loader, setLoading] = useState(true)

  // form values
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState(props.user.email)
  const [orgName, setOrgName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [claText, setClaText] = useState('')
  const [agreementType, setAgreementType] = useState('')

  useEffect(() => {
    if (props.agreementId) {
      // if there is an agreementId, go and download it
      Agreement.get(props.agreementId)
        .then(res => {
          setAgreement(res)
          setAgreementType(res.type)
          setClaText(res.body)
          setSignerName(res.signer.name)
          setSignerEmail(res.signer.value)
          if (res.type === AgreementType.INSTITUTIONAL) {
            setOrgName(res.organization)
            setOrgAddress(res.organizationAddress)
            setSignerTitle(res.signer.title)
            setPhoneNumber(res.signer.phoneNumber)
          }
          setLoading(false)
        })
        .catch(console.error)
    } else {
      fetch(`/assets/cla/default/${props.agreementType}.md?_=${Date.now()}`)
        .then((r) => r.text())
        .then(text => {
          setAgreementType(props.agreementType)
          setClaText(text)
          setLoading(false)
        })
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
        claText,
        signer
      )
    } else if (props.agreementType === AgreementType.INSTITUTIONAL) {
      agreement = new Agreement(
        AgreementType.INSTITUTIONAL,
        claText,
        signer,
        orgName,
        orgAddress
      )
    }

    agreement.save()
      .then(res => {
        if (res.type === AgreementType.INDIVIDUAL) {
          // Automatically create an addendum for the signer identity.
          return new Addendum(AddendumType.CONTRIBUTOR,
            res.id, res.signer, [res.signer], [])
            .save()
            .then(() => res.id)
        } else {
          return Promise.resolve(res.id)
        }
      })
      .then(agreementId => history.push(`/view/${agreementId}`))
      .catch(err => {
        if (err.code === 'permission-denied') {
          setError('Permission denied, please try again later')
          return
        }
        bugsnagClient.notify(err)
        setError('Request failed, please try again later')
      })
  }

  const ifInstitutional = (value, otherwise) => {
    return agreementType === AgreementType.INSTITUTIONAL ? value : otherwise
  }

  const ifSigned = (value = true, otherwise = false) => {
    return props.agreementId ? value : otherwise
  }

  // NOTE consider moving in a different component
  const signatureForm = (
    <ValidatorForm
      onSubmit={ifSigned(() => {}, handleSubmit)}
      onError={errors => console.error(errors)}>
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
            onChange={e => setSignerName(e.target.value)}
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
            display={ifInstitutional('', 'none')}
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
              validators={ifInstitutional(['required'], [])}
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
              validators={ifInstitutional(['required'], [])}
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
              validators={ifInstitutional(['required'], [])}
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
              validators={ifInstitutional(['required'], [])}
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
          <Skeleton className={classes.skeleton} variant='circle'
                    width={40} height={40}/>
          <Skeleton className={classes.skeleton} variant='text'/>
          <Skeleton className={classes.skeleton} variant='rect'
                    width={'100%'} height={118}/>
        </Paper>
        : <Paper elevation={23} className={classes.root}>
          <Grid container spacing={2}>
            {ifSigned(agreementHeader, null)}
            <Grid item xs={12}>
              <AgreementDisplay text={claText}/>
            </Grid>
          </Grid>
          {signatureForm}
          {props.agreementId ? <AddendumContainer agreement={agreement} user={props.user}/> : null}
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
