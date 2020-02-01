import React from 'react'
import PropTypes from 'prop-types'
import { Box, Card, Grid, Link } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { makeStyles } from '@material-ui/core/styles'

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

function IdentityCard (props) {
  const classes = useStyles()
  return (
    <Card variant='outlined' className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={10}>
          {props.user.name} - {props.user.email} - {props.user.githubId}
        </Grid>
        {props.callback ?
          <Grid item xs={2}>
            <Box textAlign='right' m={1}>
              <Link href='#' onClick={props.callback(props.user)}>
                <DeleteIcon></DeleteIcon>
              </Link>
            </Box>
          </Grid> : null
        }
      </Grid>
    </Card>
  )
}

IdentityCard.propTypes = {
  user: PropTypes.object.isRequired,
  callback: PropTypes.func
}

export default IdentityCard