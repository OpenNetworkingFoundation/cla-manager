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

/**
 * Input widget which lets a user sign a new agreement.
 */
function UserAccountsContainer () {
  const classes = useStyles()

  const onfHostname = 'opennetworking.org'

  const [accounts, setAccounts] = React.useState([])
  const [hasOnfAccount, setHasOnfAccount] = React.useState(true)
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
  }, [accounts])

  // Handle ONF sign in form submits by calling backend function to validate
  // credentials against Crowd.
  const verifyCrowdUser = Firebase.functions().httpsCallable('verifyCrowdUser')
  const handleSubmit = (event) => {
    event.preventDefault()
    verifyCrowdUser({ username: onfUsername, password: onfPassword })
      .then(docPath => {
        console.debug(`Authenticated! Account created at ${docPath.toString()}`)
      })
      .catch(alert)
  }

  const onfSigninForm = () => {
    return <Box>
      <p className={classes.textCenter}>
        Insert the same credentials you use for
        other ONF services, such as Gerrit, Jira, Confluence (wiki), etc.
      </p>
      <Box>
        <ValidatorForm
          onSubmit={handleSubmit}
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
          >Sign in
          </Button>
        </ValidatorForm>
      </Box>
    </Box>
  }

  const connectedAccounts = () => {
    return <Grid item xs={12}>
      <p>
        You are currently signed in with the following accounts:
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
                onClick={() => AppUser.current().deleteAccount(item.id)}
                color='secondary'>
                Sign out
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Grid>
  }

  return (
    <Paper elevation={23} className={classes.root}>
      <h2 className={classes.h2}>Member-only Access</h2>
      <Grid container>
        <p>
          Here you can connect your developer accounts to get access to
          member-only resources.
        </p>
        {accounts.length > 0 ? connectedAccounts() : null}
        {!hasOnfAccount ? onfSigninForm() : null}
      </Grid>
    </Paper>
  )
}

export default UserAccountsContainer
