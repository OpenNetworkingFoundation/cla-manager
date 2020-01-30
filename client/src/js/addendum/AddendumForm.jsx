import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Grid } from '@material-ui/core'
import { Addendum, AddendumType } from '../../common/model/addendum'
import UserForm from '../user/UserForm'

/**
 * Component which given an Addendum id displays it,
 * or display a form to create a new one
 */

function AddendumForm (props) {
  const [added, setAdded] = useState([])
  const [removed, setRemoved] = useState([])

  if (props.addendum) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5}>
          {props.addendum.added.map(u => `${u.name} - ${u.email} = ${u.githubId}`)}
        </Grid>
        <Grid item xs={12} sm={5}>
          {props.addendum.removed.map(u => `${u.name} - ${u.email} = ${u.githubId}`)}
        </Grid>
      </Grid>
    )
  }

  const signer = {
    name: 'name', // FIXME use real name
    email: props.user.email
  }

  const addUserToAddendumAdded = (user) => {
    setAdded(addendums => [...added, user])
  }

  const addUserToAddendumRemoved = (user) => {
    setRemoved(addendums => [...removed, user])
  }

  const handleSubmit = (evt) => {
    // evt.preventDefault()

    // TODO do we need validation?

    console.log(added, removed)

    const addendum = new Addendum(
      AddendumType.CONTRIBUTOR,
      props.agreementId,
      signer,
      added.map(u => u.data()),
      removed.map(u => u.data())
    )

    addendum.save().then(res => {
      props.callback(res)
      setAdded([])
      setRemoved([])
    })
      .catch(console.error)
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5}>
          Users to add:
        </Grid>
        <Grid item xs={12} sm={5}>
          Users to remove:
        </Grid>
        <Grid item xs={12} sm={2}/>
        <Grid item xs={12} sm={5}>
          {added.map(u => `${u.name} - ${u.email}`)}
          <UserForm callback={addUserToAddendumAdded}/>
        </Grid>
        <Grid item xs={12} sm={5}>
          {removed.map(u => `${u.name} - ${u.email}`)}
          <UserForm callback={addUserToAddendumRemoved}/>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Box textAlign='right' m={1}>
            <Button
              onClick={handleSubmit}
              variant='contained'
              color='primary'
              size='large'
            >Add
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

AddendumForm.propTypes = {
  user: PropTypes.object.isRequired,
  agreementId: PropTypes.string.isRequired,
  addendum: PropTypes.object,
  callback: PropTypes.func
}

export default AddendumForm
