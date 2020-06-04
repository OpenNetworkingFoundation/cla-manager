var rp = require('request-promise')
const functions = require('firebase-functions')

module.exports = GitHubAPI
/**
 * Crowd-related functions.
 * @param accessToken {string} Access Token for GitHub API
 * @return {{getUsers: getUsers, addUser:addUser, deleteUser:deleteUser}}
 * @constructor
 */
function GitHubAPI(accessToken) {
  // curl -H "Authorization: token 1bff643d42980fd0cf62d32db3ef451172a3c295" -i https://api.github.com/orgs/cloud-native-taiwan/teams/hwchiu-test/memberships/hwchiu

  const githubServer = 'api.github.com'
  const baseUri = `https://${githubServer}`
  const rpConf = {
    json: true,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'token ' + accessToken,
      'User-Agent': 'Awesome-Octocat-App'
    }
  }


  async function getUsers(org, team) {
    valid_users = []
    try {
      users = await getUsersUnderTeam(org, team)
      for (const user of users) {
        valid_users[user.login] = true
      }
    } catch (e) {
      throw new functions.https.HttpsError('Fetching user list failed' + e)
    }
    return valid_users
  }

  async function addUser(githubID, org, team) {
    try {
      await addUserToTeam(githubID, org, team)
    } catch (e) {
      throw new functions.https.HttpsError('Adding user failed' + e)
    }
  }

  async function deleteUser(githubID, org, team) {
    try {
      await deleteUserFromTeam(githubID, org, team)
    } catch (e) {
      throw new functions.https.HttpsError('Deleting user failed' + e)
    }
  }

  async function getUsersUnderTeam(org, team) {
    return rp.get({
      ...rpConf,
      uri: baseUri + `/orgs/${org}/teams/${team}/members`
    })
  }

  async function addUserToTeam(githubID, org, team) {
    return rp.put({
      ...rpConf,
      uri: baseUri + `/orgs/${org}/teams/${team}/memberships/${githubID}`
    })
  }

  async function deleteUserFromTeam(githubID, org, team) {
    return rp.delete({
      ...rpConf,
      uri: baseUri + `/orgs/${org}/teams/${team}/memberships/${githubID}`
    })
  }

  return {
    getUsers: getUsers,
    addUser: addUser,
    deleteUser: deleteUser
  }
}