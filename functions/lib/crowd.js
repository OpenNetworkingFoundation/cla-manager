const rp = require('request-promise')
const functions = require('firebase-functions')
const sha1 = require('sha1')
const admin = require('firebase-admin')

module.exports = Crowd

/**
 * Crowd-related functions.
 * @param db {FirebaseFirestore.Firestore}
 * @param appName {string} crowd app name
 * @param appPassword {string} crowd app password
 * @return {{setAppUserAccount: setAppUserAccount}}
 * @constructor
 */
function Crowd (db, appName, appPassword) {
  const onfHostname = 'opennetworking.org'
  const baseUri = `https://crowd.${onfHostname}/crowd/rest/usermanagement/1`
  const rpConf = {
    json: true,
    auth: {
      user: appName,
      pass: appPassword,
      sendImmediately: true
    }
  }

  /**
   * Validates user credentials against the Crowd server and updates the DB if
   * successful.
   *
   * This function can be called from the client.
   *
   * @param data {{username: string, password: string}} crowd credentials
   * @param context {CallableContext} firebase context
   * @return {string} account document ID
   */
  async function setAppUserAccount (data, context) {
    // Checking that the Firebase user is authenticated.
    if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('permission-denied',
        'The function must be called while authenticated')
    }

    const firebaseUid = context.auth.uid
    const crowdUsername = data.username || null
    const crowdPassword = data.password || null

    // Authenticate user against Crowd server
    let crowdSession
    try {
      crowdSession = await createSession(crowdUsername, crowdPassword)
    } catch (e) {
      throw new functions.https.HttpsError('failed-precondition',
        `Authentication failed with ${onfHostname}`)
    }

    try {
      // Authenticated! Get user info.
      const crowdUser = await getUser(crowdUsername)
      const result = {
        hostname: onfHostname,
        key: crowdUser.key,
        username: crowdUser.name,
        active: crowdUser.active,
        name: crowdUser['display-name'],
        email: crowdUser.email,
        updatedOn: new Date()
      }
      // We got what we needed. User logout.
      invalidateSession(crowdSession.token).catch(console.error)
      // Update db.
      const accountDocId = sha1(`${onfHostname}${result.key}`)
      await db.collection('appUsers')
        .doc(firebaseUid)
        .collection('accounts')
        .doc(accountDocId)
        .set(result)
      return accountDocId
    } catch (e) {
      console.log(e)
      throw new functions.https.HttpsError('internal',
        'An internal error occurred while evaluating the request')
    }
  }

  async function createSession (username, password) {
    return rp.post({
      ...rpConf,
      uri: baseUri + '/session',
      body: {
        username: username,
        password: password
      }
    })
  }

  async function invalidateSession (token) {
    return rp.del({
      ...rpConf,
      uri: baseUri + `/session/${token}`
    })
  }

  async function getUser (username) {
    return rp.get({
      ...rpConf,
      uri: baseUri + `/user?username=${username}`
    })
  }

  return {
    setAppUserAccount: setAppUserAccount
  }
}
