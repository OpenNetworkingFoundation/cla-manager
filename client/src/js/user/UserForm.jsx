import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, ButtonGroup, Grid } from '@material-ui/core'
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator'
import { makeStyles } from '@material-ui/core/styles'
import { Identity, IdentityType } from '../../common/model/identity'
import GitHubIcon from '@material-ui/icons/GitHub'
import MailOutlineIcon from '@material-ui/icons/MailOutline'


const useStyles = makeStyles(theme => ({
  textField: {
    marginBottom: theme.spacing(2)
  }
}))

function UserForm (props) {

  const classes = useStyles()

  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [type, setType] = useState(IdentityType.EMAIL)

  const handleSubmit = (evt) => {
    evt.preventDefault()
    const user = new Identity(type, name, value)
    props.callback(user)
    setName('')
    setValue('')
  }

  const selectedButton = buttonValue => buttonValue === type ? 'contained' : 'outlined'

  return (
    <ValidatorForm onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={10}>
          <ButtonGroup
            className={classes.textField}
            fullWidth
            size='large'
            color='primary'>
            <Button
              onClick={() => setType(IdentityType.EMAIL)}
              variant={selectedButton(IdentityType.EMAIL)}
              endIcon={<MailOutlineIcon/>}>
              Email</Button>
            <Button
              onClick={() => setType(IdentityType.GITHUB)}
              variant={selectedButton(IdentityType.GITHUB)}
              endIcon={<GitHubIcon/>}>
              GithubId
            </Button>
          </ButtonGroup>
          <TextValidator
            className={classes.textField}
            fullWidth
            label='Name'
            name='name'
            value={name}
            onChange={e => setName(e.target.value)}
            validators={['required']}
            errorMessages={['Enter the name of the user']}
            variant='outlined'
          />
          {type === IdentityType.EMAIL ?
            <TextValidator
              className={classes.textField}
              fullWidth
              label='Email'
              name='email'
              value={value}
              onChange={e => setValue(e.target.value)}
              validators={['required', 'isEmail']}
              errorMessages={['Enter the email address of the user']}
              variant='outlined'
            /> : null
          }
          {type === IdentityType.GITHUB ?
            <TextValidator
              className={classes.textField}
              fullWidth
              label='GitHub ID'
              name='githubId'
              value={value}
              onChange={e => setValue(e.target.value)}
              validators={['required']}
              errorMessages={['Enter the GitHub ID of the user']}
              variant='outlined'
            /> : null
          }
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            type="submit"
            variant='contained'
            color='primary'
          >Add Identity
          </Button>
        </Grid>
      </Grid>
    </ValidatorForm>
  )
}

UserForm.propTypes = {
  callback: PropTypes.func.isRequired
}

export default UserForm
