import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { AddendumType } from '../../common/model/addendum'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid
} from '@material-ui/core'
import { Agreement, AgreementType } from '../../common/model/agreement'
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace'
import { Link, useHistory } from 'react-router-dom'
import AddendumForm from './AddendumForm'

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
  const [contributorUpdateStatus, setContributorUpdateStatus] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)

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
    if (contributorUpdateStatus) {
      setOpenDialog(true)
      return
    }

    history.goBack()
  }

  return (
    <Grid container spacing={2} className="AddendumContainer">
      {props.agreement.type === AgreementType.INSTITUTIONAL ? <Grid item xs={12}>
        <AddendumForm
          user={props.user}
          agreement={props.agreement}
          addendumType={AddendumType.MANAGER}
          updateStatus={setContributorUpdateStatus}
        />
      </Grid> : null}
      <Grid item xs={12}>
        <AddendumForm
          user={props.user}
          agreement={props.agreement}
          addendumType={AddendumType.CONTRIBUTOR}
          updateStatus={setContributorUpdateStatus}
        />
      </Grid>
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
            className={'print-hidden'}
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
  user: PropTypes.object.isRequired,
  agreement: PropTypes.instanceOf(Agreement).isRequired
}

export default AddendumContainer
