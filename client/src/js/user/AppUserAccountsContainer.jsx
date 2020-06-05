import React from 'react'
import { Box, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Firebase } from '../../common/app/app'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import { ValidatorForm } from 'react-material-ui-form-validator'
import { AppUser } from '../../common/model/appUser'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

const useStyles = makeStyles(theme => ({
  formField: {
    marginBottom: theme.spacing(2)
  },
  root: {
    width: '100%',
    padding: '20px'
  },
  h2: {
    textAlign: 'center'
  },
  cell: {
    textAlign: 'center'
  },
  textCenter: {
    textAlign: 'center'
  }
}))

function AppUserAccountsContainer () {
  const classes = useStyles()

  const onfHostname = 'opennetworking.org'
  const ghHostname = 'github.com'

  const [accounts, setAccounts] = React.useState([])
  const [hasOnfAccount, setHasOnfAccount] = React.useState(true)
  const [hasGhAccount, setHasGhAccount] = React.useState(true)
  const [updateInProgress, setUpdateInProgress] = React.useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false)
  const [alertDialogMessage, setAlertDialogMessage] = React.useState('')
  // FIXME (carmelo): no need for state here. I'm too lazy to figure out how to
  //  simply read values from a form.
  const [onfUsername, setOnfUsername] = React.useState()
  const [onfPassword, setOnfPassword] = React.useState()

  // Listen for updates to the current user's accounts.
  let unsubscribeAccounts = () => {}
  React.useEffect(() => {
    if (unsubscribeAccounts) {
      unsubscribeAccounts()
    }
    unsubscribeAccounts = AppUser.current().subscribeAccounts(
      setAccounts, console.log())
  }, [Firebase.auth().currentUser])

  // When accounts change..
  React.useEffect(() => {
    console.debug('Refreshing accounts...')
    const hostnames = new Set()
    accounts.forEach(a => hostnames.add(a.hostname))
    setHasOnfAccount(hostnames.has(onfHostname))
    setHasGhAccount(hostnames.has(ghHostname))
  }, [accounts])

  const openAlertDialog = (message) => {
    setAlertDialogOpen(true)
    setAlertDialogMessage(message)
  }

  const closeAlertDialog = () => {
    setAlertDialogOpen(false)
  }

  const handleOnfLink = (event) => {
    event.preventDefault()
    const setAppUserOnfAccount = Firebase.functions()
      .httpsCallable('setAppUserOnfAccount')
    setUpdateInProgress(true)
    setAppUserOnfAccount({
      username: onfUsername,
      password: onfPassword
    })
      .then(accountId => {
        console.debug(`Linked! Account created: ${accountId.toString()}`)
      })
      .catch(error => {
        openAlertDialog(error.message)
      })
      .finally(() => setUpdateInProgress(false))
  }

  const handleGhLink = () => {
    const setAppUserGithubAccount = Firebase.functions()
      .httpsCallable('setAppUserGithubAccount')
    setUpdateInProgress(true)
    Firebase.auth().currentUser
      // If the DB ends up in an inconsistent state, honor the user's desire to
      // re-link account. As such, always tries to unlink first to a avoid
      // errors when linking.
      .unlink(ghHostname)
      .catch(() => {})
      .then(() => Firebase.auth().currentUser// Silently ignore.
        .linkWithPopup(new Firebase.auth.GithubAuthProvider()))
      .then(result => setAppUserGithubAccount({
        token: result.credential.accessToken
      }))
      .then(accountId => {
        console.debug(`Linked! Account created: ${accountId.toString()}`)
      })
      .catch(error => {
        openAlertDialog(error.message)
      })
      .finally(() => setUpdateInProgress(false))
  }

  const handleUnlink = (accountId, hostname) => {
    let firebaseUnlink
    switch (hostname) {
      case ghHostname:
        firebaseUnlink = Firebase.auth().currentUser.unlink(hostname)
        break
      default:
        // No need to unlink account in firebase.
        firebaseUnlink = Promise.resolve()
    }
    setUpdateInProgress(true)
    return firebaseUnlink
      .then(() => AppUser.current().deleteAccount(accountId))
      .catch(alert)
      .finally(() => setUpdateInProgress(false))
  }

  // TODO: make a pop up dialog
  const onfLinkForm = () => {
    return <Box>
      <p className={classes.textCenter}>
        Insert the same credentials you use for
        other ONF services, such as Gerrit, Jira, Confluence (wiki), etc.
      </p>
      <Box>
        <ValidatorForm
          onSubmit={handleOnfLink}
          onError={errors => console.error(errors)}>
          <TextField
            className={classes.formField}
            fullWidth
            label='Username'
            onChange={e => setOnfUsername(e.target.value)}
            required={true}
            value={onfUsername}
            variant='outlined'
          />
          <TextField
            className={classes.formField}
            fullWidth
            label='Password'
            onChange={e => setOnfPassword(e.target.value)}
            required={true}
            type='password'
            value={onfPassword}
            variant='outlined'
          />
          <Button
            fullWidth
            type='submit'
            variant='contained'
            color='primary'
            size='large'
            disabled={updateInProgress}
          >Link ONF account
          </Button>
        </ValidatorForm>
      </Box>
    </Box>
  }

  const ghLinkForm = () => {
    return <Box>
      <Button
        fullWidth
        variant='contained'
        color='primary'
        size='large'
        onClick={handleGhLink}
        disabled={updateInProgress}
      >Link GitHub account
      </Button>
    </Box>
  }

  const linkedAccounts = () => {
    return <Grid item xs={12}>
      <p>
        You have linked the following accounts:
      </p>
      <List>
        {accounts.map(item => (
          <ListItem divider={true} key={item.id}>
            <ListItemText
              primary={item.hostname}
              secondary={item.username}
            />
            <ListItemSecondaryAction>
              <Button
                onClick={() => handleUnlink(item.id, item.hostname)}
                color='secondary'
                disabled={updateInProgress}
              >
                Unlink
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Grid>
  }

  return (
    <div>
      <Paper elevation={23} className={classes.root}>
        <h2 className={classes.h2}>Member-only Access</h2>
        <Grid container>
          <p>
            Here you can link your developer accounts to get access to
            member-only resources.
          </p>
          {accounts.length > 0 ? linkedAccounts() : null}
          {!hasOnfAccount ? onfLinkForm() : null}
          {!hasGhAccount ? ghLinkForm() : null}
        </Grid>
      </Paper>
      <div>
        <Dialog
          open={alertDialogOpen}
          onClose={closeAlertDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle
            id="alert-dialog-title">Something went wrong</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {alertDialogMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAlertDialog} color="primary" autoFocus>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  )
}

export default AppUserAccountsContainer
