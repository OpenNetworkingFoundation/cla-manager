var rp = require('request-promise')
const functions = require('firebase-functions')

module.exports = Crowd
/**
 * Crowd-related functions.
 * @param db {FirebaseFirestore.Firestore}
 * @param appName {string} crowd app name
 * @param appPassword {string} crowd app password
 * @return {{getUsersWithGithubID: getUsersWithGithubID}}
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

  async function getUsersWithGithubID (group) {
    const validUsers = []
    let users = []
    try {
      users = await getUsersUnderGroup(group).users
    } catch (e) {
      throw new functions.https.HttpsError('Listing user failed' + e)
    }

    for (const user of users) {
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
    getUsersWithGithubID: getUsersWithGithubID
  }
}
