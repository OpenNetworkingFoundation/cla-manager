var http = require('https')
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
function Crowd(db, appName, appPassword) {
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

  async function getUsersWithGithubID(group) {
    valid_users = []
    try {
      crowdUsers = await getUsersUnderGroup(group)
    } catch (e) {
      throw new functions.https.HttpsError('Listing user failed' + e)
    }

    for (const user of crowdUsers.users) {
      try {
        user_attribute = await getAttribute(user.name)
        result = await getGithubID(user_attribute.attributes)
        if (result != "") {
          valid_users[result] = true
        }
      } catch (e) {
        throw new functions.https.HttpsError('Getting user attribute failed' + e)
      }
    }

    return valid_users
  }

  async function getUsersUnderGroup(group) {
    return rp.get({
      ...rpConf,
      uri: baseUri + `/group/user/direct?groupname=${group}&max-results=3000`
    })
  }

  async function getAttribute(name) {
    return rp.get({
      ...rpConf,
      uri: baseUri + `/user/attribute?username=${name}`
    })
  }

  async function getGithubID(attributes) {
    users = {}
    for (const attr of attributes) {
      if (attr.name == 'github_id' && attr.values.length != 0) {
        return attr.values[0]
      }
    }
    return ""
  }

  return {
    getUsersWithGithubID: getUsersWithGithubID
  }
}
