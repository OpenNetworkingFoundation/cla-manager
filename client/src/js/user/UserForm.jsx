import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button } from '@material-ui/core'
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator'
import { User } from '../../common/model/user'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  textField: {
    marginBottom: theme.spacing(2)
  }
}))

function UserForm (props) {

  const classes = useStyles()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [github, setGithub] = useState('')

  const handleSubmit = (evt) => {
    evt.preventDefault()
    const user = new User(name, email, github)
    props.callback(user)
    setName('')
    setEmail('')
    setGithub('')
  }

  return (
    <ValidatorForm onSubmit={handleSubmit}>
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
      <TextValidator
        className={classes.textField}
        fullWidth
        label='Email'
        name='email'
        value={email}
        onChange={e => setEmail(e.target.value)}
        validators={['required', 'isEmail']}
        errorMessages={['Enter the email of the user']}
        variant='outlined'
      />
      <TextValidator
        className={classes.textField}
        fullWidth
        label='Github account'
        name='github'
        value={github}
        onChange={e => setGithub(e.target.value)}
        validators={[]}
        errorMessages={['Enter the email of the user']}
        variant='outlined'
      />
      <Button
        fullWidth
        type="submit"
        variant='contained'
        color='primary'
      >Add User
      </Button>
    </ValidatorForm>
  )
}

UserForm.propTypes = {
  callback: PropTypes.func.isRequired
}

export default UserForm
