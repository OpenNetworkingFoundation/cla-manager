import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Addendum, AddendumType } from '../../common/model/addendum'
import {
  Box,
  Button,
  Card,
  Grid
} from '@material-ui/core'
import { Agreement, AgreementType } from '../../common/model/agreement'
import IdentityForm from '../identity/IdentityForm'
import IdentityCard from './IdentityCard'
import * as _ from 'lodash'
import { Alert } from '@material-ui/lab'
import { Identity, IdentityType } from '../../common/model/identity'
import { Whitelist } from '../../common/model/whitelists'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  updateFormContainer: {
    width: '100%'
  },
  bold: {
    fontWeight: 'bold'
  }
}))

/**
 * This class contains the logic for the AddendumForm component
 */
class AddendumFormCtrl {
  /**
   * Check if a User owns this agreement. For now this is true only when the User is the Signer of the Agreement.
   * This may change when we support co-signers/managers.
   * @param user {{email: string}} The Firebase user object
   * @param agreement {Agreement} An Agreement object
   * @returns {Promise<boolean>}
   */
  static async isSignerOrManager (user, agreement) {

    // if the user is the signer there's no need to check if he's a manager
    if (user.email === agreement.signer.value) {
      return true
    }

    const whitelist = await Whitelist.get(agreement.id)
    if (whitelist && whitelist.data().managers.indexOf(user.email) > -1) {
      return true
    }
    return false
  }
}

/**
 * Component which given an Agreement displays a list of associated addendums
 */
function AddendumForm (props) {

  const classes = useStyles()
  const [addendums, setAddendums] = useState([])
  const [activeIdentities, setActiveIdentities] = useState([])
  const [addedIdentities, setAddedIdentities] = useState([])
  const [removedIdentities, setRemovedIdentities] = useState([])
  const [lastAddendum, setLastAddendum] = useState(null)
  const [error, setError] = useState(null)
  const [canManage, setCanManage] = useState(false)

  React.useEffect(() => {
    props.agreement.getAddendums(props.addendumType)
      .then(setAddendums)
      .catch(console.error)
  }, [props.agreement])

  React.useEffect(() => {
    props.agreement.getWhitelist(props.addendumType)
      .then((res) => {
        setActiveIdentities(res)
      })
  }, [props.agreement, addendums])

  React.useEffect(() => {
    // FIXME this seems to be state more than effect, doublecheck
    if (addendums && addendums.length) {
      setLastAddendum(addendums[addendums.length - 1])
    } else {
      setLastAddendum(null)
    }
  }, [addendums])

  React.useEffect(() => {
    (async () => {
      AddendumFormCtrl.isSignerOrManager(props.user, props.agreement)
        .then(status => {
          setCanManage(status)
        })
    })()
  }, [props.agreement])

  const createAddendum = () => {

    const signer = new Identity(
      IdentityType.EMAIL,
      props.user.displayName, // FIXME displayName may not be set, how do we get the user name?
      props.user.email
    )

    const addendum = new Addendum(
      props.addendumType,
      props.agreement.id,
      signer,
      addedIdentities,
      removedIdentities
    )

    markUpdateStatus(true)
    addendum.save()
      .then(res => {
        setAddedIdentities([])
        setRemovedIdentities([])
      })
      .catch(err => {
        if (err.code === 'permission-denied') {
          setError('Permission denied, please try again later')
          return
        }
        setError('Request failed, please try again later')
      })
      .finally(() => {
        markUpdateStatus(false)
        setAddendums(addendums => [...addendums, addendum])
      })
  }

  const setAddedIdentity = (identity) => {
    setAddedIdentities(addedIdentities => [identity, ...addedIdentities])
    markUpdateStatus(true)
  }

  const setRemovedIdentity = (identity) => {
    return (evt) => {
      evt.preventDefault()
      setRemovedIdentities(removedIdentities => [identity, ...removedIdentities])
      _.remove(activeIdentities, identity)
      setActiveIdentities(activeIdentities)
      markUpdateStatus(true)
    }
  }

  const undoRemove = (identity) => {
    return (evt) => {
      evt.preventDefault()
      _.remove(removedIdentities, identity)
      setRemovedIdentities(removedIdentities)
      setActiveIdentities(activeIdentities => [identity, ...activeIdentities])
    }
  }

  const undoAdd = (identity) => {
    return (evt) => {
      evt.preventDefault()
      setAddedIdentities(_.without(addedIdentities, identity))
    }
  }

  const markUpdateStatus = (value) => {
    props.updateStatus(value)
  }

  const headers = {}
  headers[AddendumType.CONTRIBUTOR] = 'Active Contributors for this Agreement'
  headers[AddendumType.MANAGER] = 'Active Managers for this Agreement'

  const formTitle = {}
  formTitle[AddendumType.CONTRIBUTOR] = 'Contributors'
  formTitle[AddendumType.MANAGER] = 'Managers'

  const identityType = {}
  identityType[AddendumType.CONTRIBUTOR] = 'Contributor'
  identityType[AddendumType.MANAGER] = 'Manager'

  const subtitle = {}
  subtitle[AddendumType.CONTRIBUTOR] = 'Here is a list of Users/Identities that are authorized to make contributions to ONF projects under this agreement'
  subtitle[AddendumType.MANAGER] = 'Here is a list of Users/Identities that are allowed to add and remove Contributor Identities to/from this Agreement'

  const text = {}
  text[AddendumType.CONTRIBUTOR] = 'Users/Identities listed under "Contributors" for this Agreement will be allowed to make contributions to ONF projects.'
  text[AddendumType.MANAGER] = 'Users/Identities listed under "Managers" for this Agreement will be allowed to add and remove Contributor ' +
    'Identities to/from this Agreement AND to add and remove other Managers to/from this Agreement.'

  const updateForm = (
    <div className={classes.updateFormContainer + ' AddendumContainer__update-form print-hidden'}>
      <Grid item xs={12}>
        <Grid container spacing={2}>

          <Grid item xs={12}>
            <h2>Update {formTitle[props.addendumType]}</h2>
            <Box>
              <p className={classes.bold}>
                {text[props.addendumType]}
              </p>
              <p>
                Use the form below to add {identityType[props.addendumType]} Identities, or select one from the above list to remove it.
                <br/>
                Once done, make sure to click on &quot;Sign
                Addendum&quot; below to apply your changes.
              </p>
            </Box>
          </Grid>
          {removedIdentities.map((a, i) =>
            <Grid key={`container-removed-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} identity={a} callback={undoRemove} type={'removed'}/>
            </Grid>
          )}
          {addedIdentities.map((a, i) =>
            <Grid key={`container-added-${i}`} item xs={12} sm={12} md={6} lg={4}>
              <IdentityCard key={i} identity={a} callback={undoAdd} type={'added'}/>
            </Grid>
          )}
        </Grid>
        <Card variant='outlined' className={classes.root}>
          <IdentityForm
            callback={setAddedIdentity}
            githubAllowed={props.addendumType === AddendumType.CONTRIBUTOR}
            name={props.agreement.type === AgreementType.INDIVIDUAL && props.addendumType === AddendumType.CONTRIBUTOR ? props.agreement.signer.name : null}/>
        </Card>
      </Grid>
      <Grid item xs={12}>
        {error ? <Alert severity='error'>{error}</Alert> : null}
      </Grid>
      <Grid item xs={12}>
        <Button
          fullWidth
          variant='contained'
          size='large'
          color='primary'
          disabled={addedIdentities.length + removedIdentities.length === 0}
          onClick={createAddendum}>
          Sign Addendum
        </Button>
      </Grid>
    </div>
  )

  return (
    <Grid container spacing={2} className="AddendumContainer">
      <Grid item xs={12} className="AddendumContainer__active-identities">
        <h2>{headers[props.addendumType]}</h2>
        <p>{subtitle[props.addendumType]}: {activeIdentities.length === 0 ? <strong>EMPTY</strong> : ''}</p>
        <Grid container spacing={2}>
          {activeIdentities.map((a, i) =>
            <Grid key={`container-${i}`} item xs={12} sm={12} md={6} lg={4}
                  className="AddendumContainer__active-identity">
              <IdentityCard key={i} identity={a}
                            callback={setRemovedIdentity} type={'default'}/>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12} className="AddendumContainer__summary">
        <p>
          We have {addendums ? addendums.length : 0} addendums on file for this
          agreement. The last one was signed
          on: {lastAddendum ? lastAddendum.dateSigned.toString() : 'NEVER'}</p>
      </Grid>
      {/* TODO print a list of all the addendums if it's admin */}
      {canManage ? updateForm : null}

    </Grid>
  )
}

AddendumForm.propTypes = {
  user: PropTypes.object.isRequired,
  agreement: PropTypes.instanceOf(Agreement).isRequired,
  addendumType: PropTypes.oneOf([AddendumType.CONTRIBUTOR, AddendumType.MANAGER]).isRequired,
  updateStatus: PropTypes.func.isRequired
}

export default AddendumForm
export { AddendumFormCtrl }
