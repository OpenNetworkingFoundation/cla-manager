const { Octokit } = require('@octokit/rest')
const functions = require('firebase-functions')

module.exports = GitHubAPI
/**
 * Crowd-related functions.
 * @param accessToken {string} Access Token for GitHub API
 * @return {{getUsers: getUsers, addUser:addUser, deleteUser:deleteUser}}
 * @constructor
 */
function GitHubAPI (accessToken) {
  const octokit = new Octokit({ auth: accessToken, baseUrl: 'https://api.github.com' })

  async function getUsers (org, team) {
    const validUsers = []
    try {
      const { data: users } = await octokit.teams.listMembersInOrg({
        org: org,
        team_slug: team
      })
      for (const user of users) {
        validUsers[user.login] = true
      }
    } catch (e) {
      throw new functions.https.HttpsError('Fetching user list failed' + e)
    }
    return validUsers
  }

  async function addUser (githubID, org, team) {
    try {
      await octokit.teams.addOrUpdateMembershipInOrg({
        org: org,
        team_slug: team,
        username: githubID
      })
    } catch (e) {
      throw new functions.https.HttpsError('Adding user failed ' + e)
    }
  }

  async function deleteUser (githubID, org, team) {
    try {
      await octokit.teams.removeMembershipInOrg({
        org: org,
        team_slug: team,
        username: githubID
      })
    } catch (e) {
      throw new functions.https.HttpsError('Deleting user failed ' + e)
    }
  }

  async function createTeamIfNotExist (org, name) {
    try {
      let check = false
      const { data: teams } = await octokit.teams.list({
        org: org
      })

      // Check the existence
      for (const team of teams) {
        if (team.name === name) {
          check = true
          break
        }
      }

      // Create if necessary
      if (!check) {
        await octokit.teams.create({
          org: org,
          name: name
        })
      }
    } catch (e) {
      throw new functions.https.HttpsError('Creating team failed ' + e)
    }
  }

  return {
    getUsers: getUsers,
    addUser: addUser,
    deleteUser: deleteUser,
    createTeam: createTeamIfNotExist
  }
}
