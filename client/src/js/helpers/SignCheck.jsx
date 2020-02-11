import React, { useState } from 'react'
import PropTypes from 'prop-types'
import AgreementContainer from '../agreement/AgreementContainer'
import { AgreementType } from '../../common/model/agreement'
import { Paper, Grid, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

/**
 * Component which asks wether you are allowed to sign on behalf of your organization or not
 */

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    padding: theme.spacing(2)
  },
  h2: {
    textAlign: 'center'
  },
  cell: {
    textAlign: 'center'
  }
}))

function EmailBody (props) {
  return (
    <div>
      <h2>Copy this email and send it to someone who can sign</h2>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt enim illum, veniam autem excepturi quibusdam
        ratione iste fuga suscipit cupiditate, dicta perferendis dolor eum minus quaerat velit. Rem, dignissimos
        repudiandae?</p>
    </div>
  )
}

function SignCheck (props) {
  const classes = useStyles()
  const [allowedToSign, setAllowedToSign] = useState(undefined)
  
  if (props.agreementType === AgreementType.INDIVIDUAL) {
    return <AgreementContainer agreementType={props.agreementType} user={props.user}/>
  }

  if (allowedToSign === false) {
    return <EmailBody/>
  } else if (allowedToSign === true) {
    return <AgreementContainer agreementType={props.agreementType} user={props.user}/>
  }

  return (
    <Paper elevation={23} className={classes.root}>
      <h2 className={classes.h2}>Can you sign for you company?</h2>
      <Grid container spacing={3} justify="center">
        <Grid item xs={12} md={6} className={classes.cell}>
          <Button variant="contained" color="primary" size="large" onClick={() => setAllowedToSign(true)}>
            Yes
          </Button>
        </Grid>
        <Grid item xs={12} md={6} className={classes.cell}>
          <Button variant="contained" color="primary" size="large" onClick={() => setAllowedToSign(false)}>
            No
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}

SignCheck.propTypes = {
  user: PropTypes.object.isRequired,
  agreementType: PropTypes.string
}

export default SignCheck
