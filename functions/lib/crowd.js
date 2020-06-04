const rp = require('request-promise')
const functions = require('firebase-functions')

module.exports = Crowd

/**
 * Crowd-related functions.
 * @param db {FirebaseFirestore.Firestore}
 * @param appName {string} crowd app name
 * @param appPassword {string} crowd app password
 * @return {{verifyCrowdUser: validateCredentials}}
 * @constructor
 */
function Crowd (db, appName, appPassword) {

  const crowdServer = 'crowd.opennetworking.org'
  const baseUri = `https://${crowdServer}/crowd/rest/usermanagement/1`
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
   * successful. Returns the path to the updated document under the "users"
   * collection.
   * @param data {{username: string, password: string}} request data
   * @param context {CallableContext} firebase context
   * @return {string} user key
   */
  async function validateCredentials (data, context) {
    // Checking that the user is authenticated.
    if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('permission-denied',
        'The function must be called while authenticated')
    }

    const uid = context.auth.uid
    // Message text passed from the client.
    const username = data.username || null
    const password = data.password || null

    // Authenticate user against Crowd server
    let session
    try {
      session = await createSession(username, password)
    } catch (e) {
      throw new functions.https.HttpsError('failed-precondition',
        'Crowd authentication failed')
    }

    try {
      // Authenticated! Get user info.
      const user = await getUser(username)
      const result = {
        key: user.key,
        username: user.name,
        active: user.active,
        firstName: user['first-name'],
        lastName: user['last-name'],
        displayName: user['display-name'],
        email: user.email,
        updatedOn: new Date()
      }
      // We got what we needed. User logout.
      invalidateSession(session.token).catch(console.error)
      // Update db.
      const docPath = `${uid}/${crowdServer}/${result.key}`
      await db.collection('users')
        .doc(docPath)
        .set(result)
      return docPath
    } catch (e) {
      console.log(e)
      throw new functions.https.HttpsError('internal',
        'An internal error occurred while evaluating the request')
    }
  }

  /**
   * Validates the given credentials against the Crowd server and returns an
   * object describing the user, or null if the authentication was not
   * successful.
   * @param username {string} crowd username
   * @param password {string} crowd password
   * @return {Promise<{firstName: *, lastName: *, displayName: *, active: *,
   *   key: *, email: *, username: *}|null>} otherwise
   */
  async function validateCretendials (username, password) {
    try {
      const session = await createSession(username, password)
      // console.log(session.token)
      const user = await getUser(username)
      // console.log(user)
      const result = {
        key: user.key,
        username: user.name,
        active: user.active,
        firstName: user['first-name'],
        lastName: user['last-name'],
        displayName: user['display-name'],
        email: user.email,
        updatedOn: new Date()
      }
      await invalidateSession(session.token)
      return result
    } catch (e) {
      console.log(e)
      return null
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
    verifyCrowdUser: validateCredentials
  }
}
