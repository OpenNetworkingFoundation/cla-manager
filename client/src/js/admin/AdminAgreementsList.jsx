import React, { useEffect, useState } from 'react'
import { Card, Grid, Paper, CardContent, Typography } from '@material-ui/core'
import { Agreement, AgreementType } from '../../common/model/agreement'
import { makeStyles } from '@material-ui/core/styles'
import AgreementsTable from '../agreement/AgreementsTable'
import * as _ from 'lodash'
import { Alert } from '@material-ui/lab'
import { GetBugsnagClient } from '../../common/app/app'

const bugsnagClient = GetBugsnagClient()

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  },
  title: {
    fontSize: theme.typography.subtitle1.fontSize
  },
}))

function AdminAgreementsList (props) {
  const classes = useStyles()
  const [error, setError] = useState(null)
  const [agreements, setAgreements] = useState([])
  const [institutionalAgreements, setInstitutional] = useState(0)
  const [individualAgreements, setIndividual] = useState(0)

  useEffect(() => {
    // TODO use a subscription for real time updates
    Agreement.list()
      .then(list => {
        setInstitutional(_.countBy(list, { type: AgreementType.INSTITUTIONAL }).true)
        setIndividual(_.countBy(list, { type: AgreementType.INDIVIDUAL }).true)
        setAgreements(list)
      })
      .catch(err => {
        if (err.code === 'permission-denied') {
          setError('Permission denied, please try again later')
          return
        }
        bugsnagClient.notify(err)
        setError('Request failed, please try again later')
      })
  }, [])

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {error ? <Alert severity='error'>{error}</Alert> : null}
        </Grid>
        <Grid item xs={12}>
          <h2>Agreements list</h2>
          <p>This page shows all agreements in the system</p>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography className={classes.title} color="textSecondary" gutterBottom>
                Total Individual agreements
              </Typography>
              <Typography variant="h5" component="h2">
                {individualAgreements}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography className={classes.title} color="textSecondary" gutterBottom>
                Total Institutional agreements
              </Typography>
              <Typography variant="h5" component="h2">
                {institutionalAgreements}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <AgreementsTable
            header='All Agreements'
            extra_cols={[{ title: 'Organization', field: 'organization' }]}
            data={agreements}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminAgreementsList
