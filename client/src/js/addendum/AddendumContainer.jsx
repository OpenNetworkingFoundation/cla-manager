import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum, AddendumType } from '../../common/model/addendum'
import AddendumForm from './AddendumForm'
import { Box, Card, Grid, Link, Button } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { Agreement } from '../../common/model/agreement'
import UserForm from '../user/UserForm'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  removed: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.error.light
  },
  added: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.success.light
  }
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
        console.info(res)
        setActiveIdentities(res)
      })
  }, [props.agreementId, addendums])

  const createAddendum = () => {
    // TODO create an addendum
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

    console.log(addendum)

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
      const l = activeIdentities.reduce((identities, i) => {
        if (user !== i) {
          identities.push(i)
        }
        return identities
      }, [])
      setActiveIdentities(l)
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h2>Active identities for this agreement:</h2>
        {activeIdentities.map((a, i) =>
          <Card key={i} variant='outlined' className={classes.root}>
            <Grid container spacing={2}>
              <Grid item xs={10}>
                {a.name} - {a.email} - {a.githubId}
              </Grid>
              <Grid item xs={2}>
                <Box textAlign='right' m={1}>
                  <Link href='#' onClick={removeUser(a)}>
                    <DeleteIcon></DeleteIcon>
                  </Link>
                </Box>
              </Grid>
            </Grid>
          </Card>
        )}
      </Grid>
      <Grid item xs={12}>
        <h2>Update Agreement:</h2>
        {removedIdentities.map((a, i) =>
          <Card key={i} variant='outlined' className={classes.removed}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {a.name} - {a.email} - {a.githubId}
              </Grid>
            </Grid>
          </Card>
        )}
        {addedIdentities.map((a, i) =>
          <Card key={i} variant='outlined' className={classes.added}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {a.name} - {a.email} - {a.githubId}
              </Grid>
            </Grid>
          </Card>
        )}
        <Card variant='outlined' className={classes.root}>
          {/*<AddendumForm key='new' user={props.user} agreementId={props.agreementId} callback={addendumAdded}/>*/}
          <UserForm callback={userAdded}/>
        </Card>
      </Grid>
      <Button fullWidth
              variant='contained'
              color='primary'
              disabled={addedIdentities.length === 0 && removedIdentities.length === 0}
              onClick={createAddendum}>
        Save changes
      </Button>
    </Grid>
  )
}

AddendumContainer.propTypes = {
  user: PropTypes.object.isRequired,
  agreementId: PropTypes.string.isRequired
}

export default AddendumContainer
