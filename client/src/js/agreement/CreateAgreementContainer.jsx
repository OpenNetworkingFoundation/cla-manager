import React from 'react'
import { Link } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import { Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { AgreementType } from '../../common/model/agreement'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    padding: '20px'
  },
  h2: {
    textAlign: 'center'
  },
  cell: {
    textAlign: 'center'
  }
}))

/**
 * Input widget which lets a user sign a new agreement.
 */
function CreateAgreementContainer () {
  const classes = useStyles()
  return (
    <Paper elevation={23} className={classes.root}>
      <h2 className={classes.h2}>Sign a CLA</h2>
      <p>Who will you be submitting contributions on behalf of?</p>
      <Grid container spacing={3} justify='center'>
        <Grid item xs={12} md={6} className={classes.cell}>
          <Link to={`/sign/${AgreementType.INDIVIDUAL}`}>
            <Button variant='contained' color='primary' size='large'>
              Only Yourself / Sign Individual CLA
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} md={6} className={classes.cell}>
          <Link to={`/sign/${AgreementType.CORPORATE}`}>
            <Button variant='contained' color='primary' size='large'>
              Your Employer / Sign Corporate CLA
            </Button>
          </Link>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CreateAgreementContainer
