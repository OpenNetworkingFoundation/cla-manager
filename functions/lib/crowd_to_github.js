const Crowd = require('./crowd.js')
const GitHubAPI = require('./github_api.js')

module.exports = CrowdToGitHub
/**
 * Function to sync  functions.
 * @param crowdApp {string} crowd app name
 * @param crowdPassword {string} crowd app password
 * @param githubToken {string} Github Access token
 * @return {{getUsersWithGithubID: getUsersWithGithubID}}
 * @constructor
 */
function CrowdToGitHub (crowdApp, crowdPassword, githubToken) {
  // FIXME
  const crowdGroups = 'test-members'
  // FIXME
  const githubTeams = [
    { org: 'OpenNetworkingFoundation', team: 'xxxx' }]

  async function AuditFromCrowdToGitHub () {
    const crowd = new Crowd(null, crowdApp, crowdPassword)
    const githubAPI = new GitHubAPI(githubToken)

    // 1. Get all valid Users from Crowd serer (valid means the user has Github_id attribute)
    const crowdUsers = await crowd.getUsersWithGithubID(crowdGroups)
    console.log(crowdUsers)
    // 2. Iterate all github teams,
    for (const github of githubTeams) {
      // 3. Get all users under github team
      const githubUsers = await githubAPI.getUsers(github.org, github.team)

      // For All Crowd Users
      for (const [key] of Object.entries(crowdUsers)) {
        // Add to Github if user is not in Github
        if (!(key in githubUsers)) {
          //  githubAPI.addUser(key, github.org, github.team)
        }
      }
      // For All Github Users
      for (const [key] of Object.entries(githubUsers)) {
        // Remove from Github if user is not in Crowd
        if (!(key in crowdUsers)) {
          // githubAPI.deleteUser(key, github.org, github.team)
        }
      }
    }
  }
  return {
    AuditFromCrowdToGitHub: AuditFromCrowdToGitHub
  }
};
