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
 * @return  * @return {{setAppUserAccount: setAppUserAccount, getUsersWithGithubID: (function(*=): {}), updateCrowdUser: (function(string): Promise<* | void>)}}
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
    },
    // Otherwise requests to write APIs fail:
    // https://confluence.atlassian.com/cloudkb/xsrf-check-failed-when-calling-cloud-apis-826874382.html
    headers: {
      'X-Atlassian-Token': 'no-check'
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
        verified_emails: [],
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

  /**
   * Updates attributes for the user on Crowd based on the info stored in the DB
   * for the given Firebase app user ID.
   * @param uid {string} Firebase UID, i.e. doc ID of appUsers collections
   * @return {Promise<void>}
   */
  async function updateCrowdUser (uid) {
    // Initialize some attributes to be empty, so to implicitly unset them on
    // Crowd if the corresponding value is not found in the DB. Crowd expects
    // an array for attribute values.
    // FIXME: what happens if a user unlinks their crowd account first? We
    //  should be resetting all attributes (e.g., remove the github_id), but for
    //  this we need the removed crowd username. This can be found in the
    //  Firestore document change snapshot (old value).
    const attributeMap = {
      // A set because a Crowd attribute can hold many values, but in reality we
      // support binding to only one github ID.
      github_id: new Set(),
      // We assume as verified the following email addresses:
      // - The one used to sign up in the Firebase app
      // - The public one from the Github profile
      verified_emails: new Set()
    }
    // Fetch firebase user record from the admin SDK.
    return admin.auth().getUser(uid)
      .then(userRecord => {
        if (userRecord.email && userRecord.emailVerified) {
          attributeMap.verified_emails.add(userRecord.email)
        }
      })
      .catch(error => {
        console.log('Error fetching Firebase user record:', error)
      })
      // Fetch account data from firestore.
      .then(() => db.collection('appUsers')
        .doc(uid).collection('accounts').get())
      .then(query => {
        const accounts = query.docs.map(d => d.data())
        let crowdUsername = null
        accounts.forEach(a => {
          switch (a.hostname) {
            case onfHostname:
              crowdUsername = a.username
              break
            case 'github.com':
              attributeMap.github_id.add(a.username)
              if (a.email) {
                attributeMap.verified_emails.add(a.email)
              }
              break
            default:
              console.log(`Unrecognized account hostname ${a.hostname} for uid ${uid}, ignoring`, a)
              break
          }
        })
        if (crowdUsername == null) {
          console.log(`Cannot find Crowd account for uid ${uid}, aborting update`, accounts)
          return
        }
        // Transform attributeMap in an object understood by Crowd.
        const attributes = []
        Object.keys(attributeMap).forEach(name => {
          attributes.push({
            name: name,
            values: Array.from(attributeMap[name])
          })
        })
        console.log(`Pushing attribute for crowd user ${crowdUsername}`, attributes)
        return setUserAttribute(crowdUsername, attributes)
      })
      .catch(console.error)
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

  async function setUserAttribute (username, attributes) {
    return rp.post({
      ...rpConf,
      uri: baseUri + `/user/attribute?username=${username}`,
      body: {
        attributes: attributes
      }
    })
  }

  async function getUsersWithGithubID (group) {
    const validUsers = {}
    let users = {}
    try {
      users = await getUsersUnderGroup(group)
    } catch (e) {
      throw new Error('Listing user failed:' + e)
    }
    for (const user of users.users) {
      try {
        const userAttribute = await getAttribute(user.name)
        const result = await getGithubID(userAttribute.attributes)
        if (result !== '') {
          validUsers[result] = true
        }
      } catch (e) {
        throw new functions.https.HttpsError('Getting user attribute failed' + e)
      }
    }

    return validUsers
  }

  async function getUsersUnderGroup (group) {
    return rp.get({
      ...rpConf,
      uri: baseUri + `/group/user/direct?groupname=${group}&max-results=3000`
    })
  }

  async function getAttribute (name) {
    return rp.get({
      ...rpConf,
      uri: baseUri + `/user/attribute?username=${name}`
    })
  }

  async function getGithubID (attributes) {
    for (const attr of attributes) {
      if (attr.name === 'github_id' && attr.values.length !== 0) {
        return attr.values[0]
      }
    }
    return ''
  }

  return {
    setAppUserAccount: setAppUserAccount,
    updateCrowdUser: updateCrowdUser,
    getUsersWithGithubID: getUsersWithGithubID
  }
}
