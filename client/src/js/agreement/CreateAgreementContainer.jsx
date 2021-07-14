import React from 'react'
import { Link } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import { Card, CardContent, Typography, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { AgreementType } from '../../common/model/agreement'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    padding: theme.spacing(2),
  },
  h2: {
    textAlign: 'center'
  },
  textCenter: {
    textAlign: 'center'
  },
}))

/**
 * Input widget which lets a user sign a new agreement.
 */
function CreateAgreementContainer () {
  const classes = useStyles()
  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={3} justify='center'>
        <Grid item xs={12}>
          <h2 className={classes.h2}>Sign a CLA</h2>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" className={classes.textCenter}>
                When to sign an Individual CLA?
              </Typography>
              <Typography variant="body2" component="div">
                I should sign this CLA if:
                <ul>
                  <li>I'm making contributions of code I've created in my free time (not under contract),
                    and I hold the copyright on my contributions.
                  </li>
                  <br></br><br></br><br></br>
                </ul>
              </Typography>
              <div className={classes.textCenter}>
                <Link to={`/sign/${AgreementType.INDIVIDUAL}`}>
                  <Button variant='contained' color='primary' size='large'>
                    Sign Individual CLA
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" className={classes.textCenter}>
                When to sign an Institutional CLA?
              </Typography>
              <Typography variant="body2" component="div">
                I should sign this CLA if:
                <ul>
                  <li>I'm making contributions as an employee or under a contract or other agreement with a company,
                    and that company holds the copyright and any patents rights on my contributions.
                  </li>
                  <li>I'm employing (or contracting with) someone to contribute to the project and I hold the copyright
                    and any patents rights on their contributions.
                  </li>
                </ul>
              </Typography>
              <div className={classes.textCenter}>
                <Link to={`/sign/${AgreementType.INSTITUTIONAL}`}>
                  <Button variant='contained' color='primary' size='large'>
                    Sign Institutional CLA
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CreateAgreementContainer
