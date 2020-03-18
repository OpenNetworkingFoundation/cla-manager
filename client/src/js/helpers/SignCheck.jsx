import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import PropTypes from 'prop-types'
import AgreementContainer from '../agreement/AgreementContainer'
import { AgreementType } from '../../common/model/agreement'
import { Button, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { ClaRequestInstitutional } from '../text/Text'

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
  },
  textCenter: {
    textAlign: 'center'
  }
}))

function EmailBody (props) {
  return (
    <div>
      <h2>Below is a sample email you should send to the person at your company who is authorized to sign ONF Institutional CLA.</h2>
      <p><i>If you don't know who that person is, you can start with your manager or director or company lawyer.</i></p>
      <ReactMarkdown source={ClaRequestInstitutional} />
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
      <h2 className={classes.h2}>Are you authorized to sign legal agreements for your company?</h2>
      <p className={classes.textCenter}>
        Typically, this means you are an executive (e.g., CEO or CTO) or officer that is explicitly
        authorized by your company's board.
      </p>
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
