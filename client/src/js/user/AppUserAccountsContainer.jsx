import React from 'react'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Firebase } from '../../common/app/app'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
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
import { ValidatorForm } from 'react-material-ui-form-validator'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'

const useStyles = makeStyles(theme => ({
  formField: {
    marginBottom: theme.spacing(2)
  },
  root: {
    padding: '20px'
  },
}))

function AppUserAccountsContainer () {
  const classes = useStyles()

  const onfHostname = 'opennetworking.org'
  const ghHostname = 'github.com'
  const linkableHostnames = [onfHostname, ghHostname]

  const [accounts, setAccounts] = React.useState([])
  const [updateInProgress, setUpdateInProgress] = React.useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false)
  const [alertDialogMessage, setAlertDialogMessage] = React.useState('')
  const [onfSignInDialogOpen, setOnfSignInDialogOpen] = React.useState(false)
  // FIXME (carmelo): no need for state here. I'm too lazy to figure out how to
  //  simply read values from a form.
  const [onfUsername, setOnfUsername] = React.useState('')
  const [onfPassword, setOnfPassword] = React.useState('')

  const refreshAccounts = (newAccounts) => {
    const hostnames = new Set()
    newAccounts.forEach(a => hostnames.add(a.hostname))
    // Replace missing accounts with "linkable" placeholders
    linkableHostnames.forEach(h => {
      if (!hostnames.has(h)) {
        newAccounts.push({
          id: h,
          hostname: h,
          username: null
        })
      }
    })
    // Sort by hostname
    newAccounts.sort((a, b) => (a.hostname > b.hostname)
      ? 1 : ((b.hostname > a.hostname) ? -1 : 0))
    setAccounts(newAccounts)
  }

  // Listen for updates to the current user's accounts.
  let unsubscribeAccounts = () => {}
  React.useEffect(() => {
    if (unsubscribeAccounts) {
      unsubscribeAccounts()
    }
    unsubscribeAccounts = AppUser.current().subscribeAccounts(
      refreshAccounts, console.log())
  }, [Firebase.auth().currentUser])

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
      .finally(() => {
        setUpdateInProgress(false)
        setOnfSignInDialogOpen(false)
        setOnfUsername('')
        setOnfPassword('')
      })
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

  const handleLink = (hostname) => {
    switch (hostname) {
      case onfHostname:
        setOnfSignInDialogOpen(true)
        break
      case ghHostname:
        handleGhLink()
        break
      default:
        break
    }
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

  const accountButton = function (account) {
    if (account.username) {
      return <Button
        onClick={() => handleUnlink(account.id, account.hostname)}
        color='secondary'
        disabled={updateInProgress}
      >
        Unlink
      </Button>
    } else {
      return <Button
        onClick={() => handleLink(account.hostname)}
        color='primary'
        variant='contained'
        disabled={updateInProgress}
      >
        Link
      </Button>
    }
  }

  const onfSignInDialog = () => {
    return (
      <div>
        <Dialog
          open={onfSignInDialogOpen}
          onClose={() => setOnfSignInDialogOpen(false)}
          aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">Link ONF Account</DialogTitle>
          <ValidatorForm
            onSubmit={handleOnfLink}
            onError={errors => console.error(errors)}>
            <DialogContent>
              <DialogContentText>
                Insert the same credentials you use for
                other ONF services, such as Gerrit, Jira, Confluence (wiki),
                Jenkins, etc.
              </DialogContentText>
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
            </DialogContent>
            <DialogActions>
              <Button
                fullWidth
                type='submit'
                variant='contained'
                color='primary'
                size='large'
                disabled={updateInProgress}
              >Sign In
              </Button>
            </DialogActions>
          </ValidatorForm>
        </Dialog>
      </div>
    )
  }

  const alertDialog = () => {
    return <div>
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
  }

  return <div>
    <Paper elevation={23} className={classes.root}>
      <Grid container>
        <Grid item xs={12}>
          <Box textAlign='center'>
            <h2 className={classes.h2}>Link your Accounts</h2>
            <Typography variant={'body1'} gutterBottom>
              If your employer is an <a
              href="https://opennetworking.org/member-listing/">ONF Member</a>, you can link
              your ONF account to your GitHub account to be granted access to Member-only
              resources shared in GitHub.  Once both accounts are linked, you will receive
              invitations from GitHub to Member-only teams.
            </Typography>
            <Typography variant={'body2'} gutterBottom>
              Your ONF account is the same account used to access other
              opennetworking.org services such as Gerrit, Jira, Confluence, Jenkins, etc.
              If your employer is already an ONF Member, but you don't have an ONF
              account, please register using your work email address at:
              <a href='https://www.opennetworking.org/register/' target='_blank'>
              https://www.opennetworking.org/register/</a>.
            </Typography>
            <Typography variant={'body2'} gutterBottom>
              <strong>Note:</strong> Browser pop-up windows are used when linking/unlinking
              accounts, so allow your web browser to display these if prompted.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <List>
            {accounts.map(account => (
              <ListItem divider={true} key={account.id}>
                <ListItemText
                  primary={account.hostname}
                  secondary={account.username ? account.username : '(not linked)'}
                />
                <ListItemSecondaryAction>
                  {accountButton(account)}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Paper>
    {alertDialog()}
    {onfSignInDialog()}
  </div>
}

export default AppUserAccountsContainer
