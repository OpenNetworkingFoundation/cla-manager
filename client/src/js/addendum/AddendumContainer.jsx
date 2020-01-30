import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum } from '../../common/model/addendum'
import AddendumForm from './AddendumForm'
import { Card, Grid } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

/**
 * Component which given an Agreement displays a list of associated addendums
 */
function AddendumContainer (props) {
  const classes = useStyles()
  const [addendums, setAddendums] = useState([])

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

  const addendumAdded = (addendum) => {
    setAddendums(addendums => [...addendums, addendum])
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card variant='outlined' className={classes.root}>
          {addendums.map(a => <AddendumForm
            key={a.id} user={props.user} agreementId={props.agreementId}
            addendum={a}
          />)}
          <AddendumForm key='new' user={props.user} agreementId={props.agreementId} callback={addendumAdded} />
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
