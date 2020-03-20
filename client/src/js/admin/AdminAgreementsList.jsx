import React, { useEffect, useState } from 'react'
import { Grid, Paper } from '@material-ui/core'
import { Agreement, AgreementType } from '../../common/model/agreement'
import { makeStyles } from '@material-ui/core/styles'
import AgreementsTable from '../agreement/AgreementsTable'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

function AdminAgreementsList (props) {

  const classes = useStyles()
  const [agreements, setAgreements] = useState([])

  useEffect(() => {
    Agreement.list()
      .then(setAgreements)
      .catch(console.error) // FIXME handle errors
  }, [])

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>Agreements list</h2>
          <p>This page let you see a list of all the available agreements</p>
        </Grid>
        <Grid item xs={12}>
          <AgreementsTable
            header='All Agreements'
            type={AgreementType.INSTITUTIONAL}
            data={agreements}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminAgreementsList
