import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Paper } from '@material-ui/core'
import MaterialTable from 'material-table'
import { Domain } from '../../common/model/domain'
import Fade from '@material-ui/core/Fade';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  }
}))

function AdminDomains (props) {
  const classes = useStyles()
  
  const [validDomains, setValidDomains] = useState([])
  const [invalidDomains, setInvalidDomains] = useState([])
  
  const [error, setError] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  
  const [checked, setChecked] = React.useState(false);

  const validDomainColumns = [
    { title: 'Company Domain Name', field: 'name' },
    { title: 'Validated On', field: 'createdOn', type: 'date', editable: 'never'},
  ]

  const invalidDomainColumns = [
    { title: 'Company Domain Name', field: 'name' },
    { title: 'Validated On', field: 'createdOn', type: 'date'},
    { title: 'Invalidated On', field: 'deletedOn', type: 'date' }
  ]

  const handleChange = () => {
    setChecked((prev) => !prev);
  };
    
  React.useEffect(() => {
    Domain.listValidDomains().then(res => {
      setValidDomains(res)
    })
      .catch(console.error)
  }, [])

  React.useEffect(() => {
    Domain.listInvalidDomains().then(res => {
      setInvalidDomains(res)
    })
      .catch(console.error)
  }, [])
  
  function formatDomain(domain) {
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain)) {
      return true;
    }
    return false;
  }

  return (
    <Paper elevation={23} className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h2>Manage Domains</h2>
          <p>This page let you see a list of all the approved domains</p>
          <Collapse in={error}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >      
              {error}
            </Alert>
          </Collapse>
          <Collapse in={success}>
            <Alert
              severity="success"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setSuccess(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {success}
            </Alert>
          </Collapse>
        </Grid>
        <Grid item xs={12}>
          <MaterialTable
            title="Approved Domains"
            columns={validDomainColumns}
            data={validDomains}
            options={{
                sorting: true
            }}
            editable={{
                onRowAdd: newData =>
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                    let isValid = formatDomain(newData.name)
                    if(isValid || window.confirm("The domain you entered is formatted badly. Do you still wish to proceed?")) {
                      Domain.checkIfDomainExists(newData.name).then((response) => {
                        if(response) {
                          setSuccess(false)
                          setError("The domain " + newData.name + " already exists in the list of valid domains")
                        } else {
                          const domain = new Domain(null, newData.name, true)
                          domain.validate().then((response) => setValidDomains([response, ...validDomains]))
                          setError(false)
                          setSuccess("The domain " + newData.name + " was successfully VALIDATED on " + domain._createdOn.toLocaleString())
                        }
                      })
                    }
                    resolve()
                    }, 1000)
                }),
                onRowDelete: oldData =>
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                    const dataDelete = [...validDomains]
                    const index = oldData.tableData.id
                    dataDelete.splice(index, 1)
                    oldData._deletedOn = new Date().toLocaleString()
                    Domain.invalidate(oldData.id)
                    setValidDomains([...dataDelete])
                    setError(false)
                    setSuccess("The domain " + oldData.name + " was successfully INVALIDATED on " + oldData._deletedOn)
                    setInvalidDomains([oldData, ...invalidDomains])
                    resolve()
                    }, 1000)
                }),
            }}
            />
        </Grid>
        <Grid item xs={12}>
            <div className={classes.root}>
                <FormControlLabel
                    control={<Switch checked={checked} onChange={handleChange} />}
                    label="See Invalid Domains"
                />
                <div className={classes.container}>
                    <Fade in={checked} unmountOnExit>
                        <Grid item xs={12}>
                            <MaterialTable
                                title="Invalid Domains"
                                columns={invalidDomainColumns}
                                data={invalidDomains}
                                options={{
                                    sorting: true
                                }}
                            />
                        </Grid>
                    </Fade>
                </div>
            </div>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default AdminDomains
