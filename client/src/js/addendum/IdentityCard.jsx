import React from 'react'
import PropTypes from 'prop-types'
import { Box, Card, Grid, Link, Typography, CardContent, IconButton } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import MailOutlineIcon from '@material-ui/icons/MailOutline'
import GitHubIcon from '@material-ui/icons/GitHub'
import ClearIcon from '@material-ui/icons/Clear'
import { makeStyles } from '@material-ui/core/styles'
import { Identity, IdentityType } from '../../common/model/identity'

const useStyles = makeStyles(theme => ({
  default: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  removed: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    borderColor: theme.palette.error.light
  },
  added: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    borderColor: theme.palette.success.light
  },
  identityContainer: {
    position: 'relative',
    '&:hover div': {
      visibility: 'visible'
    }
  },
  emailContainer: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    position: 'relative'
  },
  emailTooltip: {
    visibility: 'hidden',
    backgroundColor: 'black',
    color: '#fff',
    textAlign: 'center',
    borderRadius: '6px',
    padding: '5px',

    /* Position the tooltip */
    position: 'absolute',
    top: '-10px',
    zIndex: 1
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
            {props.identity.type === IdentityType.GITHUB ? <GitHubIcon fontSize={'large'}/> : null}
            {props.identity.type === IdentityType.EMAIL ? <MailOutlineIcon fontSize={'large'}/> : null}
          </CardContent>
        </Grid>
        <Grid item xs={8}>
          <CardContent className={classes.identityContainer}>
            <div className={classes.emailTooltip}>{props.identity.value}</div>
            {props.type !== 'default' ? <Typography color="textSecondary" gutterBottom>
              {props.type.charAt(0).toUpperCase() + props.type.slice(1)}
            </Typography> : null}
            <Typography variant="h5" component="h5" className={classes.emailContainer}>
              {props.identity.value}
            </Typography>
            <Typography className={classes.pos} color="textSecondary">
              {props.identity.name}
            </Typography>
          </CardContent>
        </Grid>
        {props.callback
          ? <Grid item xs={2}>
            <CardContent>
              <Box textAlign='right' m={1} className={'print-hidden'}>
                <Link href='#' onClick={props.callback(props.identity)}>
                  <IconButton size='small' color='primary'>
                    {props.type === 'default' ? <DeleteIcon/> : null}
                    {props.type !== 'default' ? <ClearIcon/> : null}
                  </IconButton>
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
  identity: PropTypes.instanceOf(Identity).isRequired,
  type: PropTypes.oneOf(['added', 'removed', 'default']).isRequired,
  callback: PropTypes.func
}

export default IdentityCard
