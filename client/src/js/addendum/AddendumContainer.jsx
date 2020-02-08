import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum, AddendumType } from '../../common/model/addendum'
import { Card, Grid, Button, Box } from '@material-ui/core'
import { Agreement } from '../../common/model/agreement'
import UserForm from '../user/UserForm'
import IdentityCard from './IdentityCard'
import * as _ from 'lodash'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
}))

/**
 * Component which given an Agreement displays a list of associated addendums
 */
function AddendumContainer (props) {
  const classes = useStyles()
  const [addendums, setAddendums] = useState([])
  const [activeIdentities, setActiveIdentities] = useState([])
  const [addedIdentities, setAddedIdentities] = useState([])
  const [removedIdentities, setRemovedIdentities] = useState([])

  useEffect(() => {
    Addendum.get(props.agreementId)
      .then(res => {
        // go from whatever Firebase returns to a real array
        // TODO consider to move this in the models
        const parsed = []
        res.forEach(r => {
          const d = r.data()
          d.id = r.id
          parsed.push(d)
        })
        setAddendums(parsed)
      })
      .catch(console.error)
  }, [props.agreementId])

  useEffect(() => {
    Agreement.get(props.agreementId)
      .then(agreement => {
        return agreement.getActiveUser()
      })
      .then((res) => {
        setActiveIdentities(res)
      })
  }, [props.agreementId, addendums])

  const createAddendum = () => {
    const signer = {
      name: 'name', // FIXME use real name
      email: props.user.email
    }

    const addendum = new Addendum(
      AddendumType.CONTRIBUTOR,
      props.agreementId,
      signer,
      addedIdentities.map(u => u.toJson()),
      removedIdentities
    )

    addendum.save().then(res => {
      setAddedIdentities([])
      setRemovedIdentities([])
    })
      .catch(console.error)

    setAddendums(addendums => [...addendums, addendum])
  }

  const userAdded = (user) => {
    setAddedIdentities(addedIdentities => [user, ...addedIdentities])
  }

  const removeUser = (user) => {
    return (evt) => {
      evt.preventDefault()
      setRemovedIdentities(removedIdentities => [user, ...removedIdentities])
      _.remove(activeIdentities, user)
      setActiveIdentities(activeIdentities)
    }
  }

  const undoRemove = (user) => {
    return (evt) => {
      evt.preventDefault()
      _.remove(removedIdentities, user)
      setRemovedIdentities(removedIdentities)
      setActiveIdentities(activeIdentities => [user, ...activeIdentities])
    }
  }

  const undoAdd = (user) => {
    return (evt) => {
      evt.preventDefault()
      setAddedIdentities(_.without(addedIdentities, user))
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h2>Active identities for this agreement:</h2>
        <Box>here is a list of identities that are authorized to contribute code under this agreement</Box>
        <Grid container spacing={2}>
          {activeIdentities.map((a, i) =>
            <Grid key={`container-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} user={a} callback={removeUser} type={'default'}/>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <h2>Update Agreement:</h2>
        <Box>
          You can modify the people allowed to contribute code under this agreement by adding or removing them from it. <br/>
          Make sure to click on &quot;Sign Addendum&quot; below
        </Box>
        <Grid container spacing={2}>
          {removedIdentities.map((a, i) =>
            <Grid key={`container-removed-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} user={a} callback={undoRemove} type={'removed'}/>
            </Grid>
          )}
          {addedIdentities.map((a, i) =>
            <Grid key={`container-added-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} user={a} callback={undoAdd} type={'added'}/>
            </Grid>
          )}
        </Grid>
        <Card variant='outlined' className={classes.root}>
          <UserForm callback={userAdded}/>
        </Card>
      </Grid>
      <Button fullWidth
              variant='contained'
              color='primary'
              disabled={addedIdentities.length === 0 && removedIdentities.length === 0}
              onClick={createAddendum}>
        Sign Addendum
      </Button>
    </Grid>
  )
}

AddendumContainer.propTypes = {
  user: PropTypes.object.isRequired,
  agreementId: PropTypes.string.isRequired
}

export default AddendumContainer
