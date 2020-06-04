import React from 'react'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Firebase } from '../../common/app/app'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import { ValidatorForm } from 'react-material-ui-form-validator'

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
function UserCrowdSignInContainer () {
  const classes = useStyles()
  const [crowdUsername] = React.useState()
  const [crowdPassword] = React.useState()
  // UserCrowSignIn('carmelo', '688Y2dCzP2')
  const handleSubmit = (event) => {
    event.preventDefault()
    const verifyCrowdUser = Firebase.functions().httpsCallable('verifyCrowdUser')
    verifyCrowdUser({ username: crowdUsername, password: crowdPassword })
      .then(console.log).catch(console.error)
  }
  return (
    <Paper elevation={23} className={classes.root}>
      <h2 className={classes.h2}>Connect your ONF account</h2>
      <p className={classes.textCenter}>Insert the same credentials you use for other ONF services, such as Gerrit, Jira, Confluence (wiki), etc.</p>
      <Grid container spacing={3} justify='center'>
        <ValidatorForm
          onSubmit={handleSubmit}
          onError={errors => console.error(errors)}>
          <TextField
            fullWidth
            label='Username'
            name='username'
            value={crowdUsername}
            variant='outlined'
            className={classes.formField}
            required={true}
          />
          <TextField
            fullWidth
            label='Password'
            name='password'
            variant='outlined'
            value={crowdPassword}
            type='password'
            className={classes.formField}
            required={true}
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
      </Grid>
    </Paper>
  )
}

export default UserCrowdSignInContainer
