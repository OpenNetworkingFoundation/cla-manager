import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum } from '../../common/model/addendum'
import AddendumForm from './AddendumForm'
import { Box, Card, Grid, Link } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { Agreement } from '../../common/model/agreement'

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
  const classes = useStyles()
  const [addendums, setAddendums] = useState([])
  const [identities, setIdentities] = useState([])

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
        console.log(agreement)
        return agreement.getActiveUser()
      })
      .then(setIdentities)
    console.log('foo')
  }, [addendums])

  const addendumAdded = (addendum) => {
    setAddendums(addendums => [...addendums, addendum])
  }

  const removeUser = (s) => {
    return (evt) => {
      evt.preventDefault()
      alert('unimplemented')
      console.log(s)
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h2>Active identities for this agreement:</h2>
        {identities.map((a, i) =>
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
        <h2>Create new identity:</h2>
        <Card variant='outlined' className={classes.root}>
          <AddendumForm key='new' user={props.user} agreementId={props.agreementId} callback={addendumAdded}/>
        </Card>
      </Grid>
    </Grid>
  )
}

AddendumContainer.propTypes = {
  user: PropTypes.object.isRequired,
  agreementId: PropTypes.string.isRequired
}

export default AddendumContainer
