import React, { useEffect, useState } from 'react'
import { Box, Button, Card, Grid, Paper } from '@material-ui/core'
import { Agreement } from '../../common/model/agreement'
import { makeStyles } from '@material-ui/core/styles'
import AgreementsTable from '../agreement/AgreementsTable'
import Link from '@material-ui/core/Link'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}))

function AdminAgreementsList (props) {

  const classes = useStyles()
  const [agreements, setAgreements] = useState([])

  const dateOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  useEffect(() => {
    Agreement.list().then(res => {
      const _agreements = res.map(i => {
        const linkUrl = `/view/${i.id}`
        return {
          id: i.id,
          name: i.signer.name,
          displayDate: i.dateSigned.toLocaleDateString('default', dateOptions),
          link: <Link href={linkUrl}><Button variant='outlined' color='primary'>View/Edit</Button></Link>
        }
      })
      setAgreements(_agreements)
    }).catch(console.error)
  }, [])

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>Agreements list</h2>
        </Grid>
        <Grid item xs={12}>
          <AgreementsTable
            header='Agreements'
            description='List of agreements in the system'
            columnTitles={['Organization', 'Signatory', 'Date Signed', 'Actions']}
            columnIds={['organization', 'name', 'displayDate', 'link']}
            data={agreements}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminAgreementsList
