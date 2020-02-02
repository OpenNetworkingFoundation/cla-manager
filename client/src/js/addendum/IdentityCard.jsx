import React from 'react'
import PropTypes from 'prop-types'
import { Box, Card, Grid, Link, Typography, CardContent } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import MailOutlineIcon from '@material-ui/icons/MailOutline'
import GitHubIcon from '@material-ui/icons/GitHub'
import { makeStyles } from '@material-ui/core/styles'
import { IdentityType } from '../../common/model/identity'

const useStyles = makeStyles(theme => ({
  default: {
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

  const getClass = type => classes[type]

  return (
    <Card variant='outlined' className={getClass(props.type)}>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <CardContent>
            {props.user.type === IdentityType.GITHUB ? <GitHubIcon fontSize={'large'}/> : null}
            {props.user.type === IdentityType.MAIL ? <MailOutlineIcon fontSize={'large'}/> : null}
          </CardContent>
        </Grid>
        <Grid item xs={8}>
          <CardContent>
            <Typography variant="h5" component="h2">
              {props.user.value}
            </Typography>
            <Typography className={classes.pos} color="textSecondary">
              {props.user.name}
            </Typography>
          </CardContent>
        </Grid>
        {props.callback ?
          <Grid item xs={2}>
            <CardContent>
              <Box textAlign='right' m={1}>
                <Link href='#' onClick={props.callback(props.user)}>
                  <DeleteIcon></DeleteIcon>
                </Link>
              </Box>
            </CardContent>
          </Grid> : null
        }
      </Grid>
    </Card>
  )
}

IdentityCard.propTypes = {
  user: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['added', 'removed', 'default']).isRequired,
  callback: PropTypes.func
}

export default IdentityCard
