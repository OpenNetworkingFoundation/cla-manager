import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum, AddendumType } from '../../common/model/addendum'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid
} from '@material-ui/core'
import { Agreement, AgreementType } from '../../common/model/agreement'
import IdentityForm from '../identity/IdentityForm'
import IdentityCard from './IdentityCard'
import * as _ from 'lodash'
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace'
import { Link, useHistory } from 'react-router-dom'
import { Alert } from '@material-ui/lab'
import { FirebaseApp } from '../../common/app/app'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  }
}))

/**
 * Component which given an Agreement displays a list of associated addendums
 */
function AddendumContainer (props) {
  const history = useHistory()
  const classes = useStyles()
  const [addendums, setAddendums] = useState([])
  const [activeIdentities, setWhitelist] = useState([])
  const [addedIdentities, setAddedIdentities] = useState([])
  const [removedIdentities, setRemovedIdentities] = useState([])
  const [updateInProgress, setUpdateInProgress] = useState(false)
  const [lastAddendum, setLastAddendum] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    props.agreement.getAddendums()
      .then(setAddendums)
      .catch(console.error)
  }, [props.agreement])

  useEffect(() => {
    Agreement.get(props.agreement.id)
      .then(agreement => {
        return agreement.getWhitelist()
      })
      .then((res) => {
        setWhitelist(res)
      })
  }, [props.agreement.id, addendums])

  useEffect(() => {
    if (addendums && addendums.length) {
      setLastAddendum(addendums[addendums.length - 1])
    } else {
      setLastAddendum(null)
    }
  }, [addendums])

  useEffect(() => {
    FirebaseApp.auth().currentUser.getIdTokenResult()
      .then(token => {
        setAdmin(token.claims.admin)
      })
  }, [])

  const createAddendum = () => {
    const addendum = new Addendum(
      AddendumType.CONTRIBUTOR,
      props.agreement.id,
      props.agreement.signer,
      addedIdentities,
      removedIdentities
    )

    setUpdateInProgress(true)
    addendum.save()
      .then(res => {
        setAddedIdentities([])
        setRemovedIdentities([])
      })
      .catch(err => {
        if (err.code === 'permission-denied') {
          setError('Permission denied, please try again later')
          return
        }
        setError('Request failed, please try again later')
      })
      .finally(() => {
        setUpdateInProgress(false)
        setAddendums(addendums => [...addendums, addendum])
      })
  }

  const setAddedIdentity = (identity) => {
    setAddedIdentities(addedIdentities => [identity, ...addedIdentities])
  }

  const setRemovedIdentity = (identity) => {
    return (evt) => {
      evt.preventDefault()
      setRemovedIdentities(removedIdentities => [identity, ...removedIdentities])
      _.remove(activeIdentities, identity)
      setWhitelist(activeIdentities)
    }
  }

  const undoRemove = (identity) => {
    return (evt) => {
      evt.preventDefault()
      _.remove(removedIdentities, identity)
      setRemovedIdentities(removedIdentities)
      setWhitelist(activeIdentities => [identity, ...activeIdentities])
    }
  }

  const undoAdd = (identity) => {
    return (evt) => {
      evt.preventDefault()
      setAddedIdentities(_.without(addedIdentities, identity))
    }
  }

  const confirmLeave = (val) => {
    if (val === false) {
      setOpenDialog(false)
      return
    }
    history.goBack()
  }

  const goBack = () => {
    // NOTE we need to use a callback instead of a Link as we want to check
    // that there are no unsaved changes

    if (addedIdentities.length > 0 || removedIdentities.length > 0) {
      setOpenDialog(true)
      return
    }

    history.goBack()
  }

  const updateForm = (
    <div>
      <Grid item xs={12}>
        <Grid container spacing={2}>

          <Grid item xs={12}>
            <h2>Update Agreement</h2>
            <Box>
              <p>
                You can sign a new "addendum" to modify the identities allowed
                to contribute under this agreement. Use the form below to add
                identities, or select one from the above list to remove it.
              </p>
              <p>
                Once done, make sure to click on &quot;Sign
                Addendum&quot; below to apply your changes.
              </p>
            </Box>
          </Grid>
          {removedIdentities.map((a, i) =>
            <Grid key={`container-removed-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} identity={a} callback={undoRemove} type={'removed'}/>
            </Grid>
          )}
          {addedIdentities.map((a, i) =>
            <Grid key={`container-added-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} identity={a} callback={undoAdd} type={'added'}/>
            </Grid>
          )}
        </Grid>
        <Card variant='outlined' className={classes.root}>
          <IdentityForm
            callback={setAddedIdentity}
            name={props.agreement.type === AgreementType.INDIVIDUAL ? props.agreement.signer.name : null}/>
        </Card>
      </Grid>
      <Grid item xs={12}>
        {error ? <Alert severity='error'>{error}</Alert> : null}
      </Grid>
      <Grid item xs={12}>
        <Button
          fullWidth
          variant='contained'
          size='large'
          color='primary'
          disabled={updateInProgress || addedIdentities.length + removedIdentities.length === 0}
          onClick={createAddendum}>
          Sign Addendum
        </Button>
      </Grid>
    </div>
  )

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h2>Active Identities for this Agreement</h2>
        <p>Here is a list of identities that are authorized to contribute code
          under this agreement: {activeIdentities.length === 0 ? <strong>EMPTY</strong> : ''}</p>
        <Grid container spacing={2}>
          {activeIdentities.map((a, i) =>
            <Grid key={`container-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} identity={a} callback={setRemovedIdentity} type={'default'}/>
            </Grid>
          )}
        </Grid>
        <p>
          We have {addendums ? addendums.length : 0} addendums on file for this
          agreement. The last one was signed
          on: {lastAddendum ? lastAddendum.dateSigned.toString() : 'NEVER'}</p>
      </Grid>
      {/* TODO print a list of all the addendums if it's admin */}
      {admin ? null : updateForm}

      <Grid item xs={12}>
        <Dialog
          onClose={confirmLeave}
          aria-labelledby="confirm-leave"
          open={openDialog}>
          <DialogTitle id="alert-dialog-title">{'Use Google\'s location service?'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              You have unsaved changes, are you sure you want to leave?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => confirmLeave(false)} color="primary">
              No, continue editing
            </Button>
            <Button onClick={() => confirmLeave(true)} color="primary" autoFocus>
              Yes, leave
            </Button>
          </DialogActions>
        </Dialog>
        <Link to="#" onClick={goBack}>
          <Button
            className={classes.back}
            variant='contained'
            color='primary'
            size='large'
            endIcon={<KeyboardBackspaceIcon/>}
          >
            Back
          </Button>
        </Link>
      </Grid>
    </Grid>
  )
}

AddendumContainer.propTypes = {
  agreement: PropTypes.instanceOf(Agreement).isRequired
}

export default AddendumContainer
