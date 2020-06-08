const Crowd = require('./crowd.js')
const GitHubAPI = require('./github_api.js')
const functions = require('firebase-functions')

module.exports = CrowdToGitHub
/**
 * Function to sync  functions.
 * @param crowdApp {string} crowd app name
 * @param crowdPassword {string} crowd app password
 * @param githubToken {string} Github Access token
 * @param period {string} period for scheduled function
 * @return {{getUsersWithGithubID: getUsersWithGithubID}}
 * @constructor
 */
function CrowdToGitHub (crowdApp, crowdPassword, githubToken, period) {
  const crowdGroups = ['members', 'AetherAccess', 'ONFStaff']
  // FIXME
  const githubOrganizations = []

  async function AuditFromCrowdToGitHub () {
    const crowd = new Crowd(null, crowdApp, crowdPassword)
    const githubAPI = new GitHubAPI(githubToken)

    // Iterate all Crowd groups
    for (const crowdGroup of crowdGroups) {
      // Get all valid Users from Crowd serer (valid means the user has Github_id attribute)
      const crowdUsers = await crowd.getUsersWithGithubID(crowdGroup)
      // Iterate all github organization,
      for (const org of githubOrganizations) {
        // Create the Team if necessary
        await githubAPI.createTeam(org, crowdGroup)

        // Get all users under github team
        const githubUsers = await githubAPI.getUsers(org, crowdGroup)
        // For All Crowd Users
        for (const [key] of Object.entries(crowdUsers)) {
          // Add to Github if user is not in Github
          if (!(key in githubUsers)) {
            githubAPI.addUser(key, org, crowdGroup)
          }
        }
        // For All Github Users
        for (const [key] of Object.entries(githubUsers)) {
          // Remove from Github if user is not in Crowd
          if (!(key in crowdUsers)) {
            githubAPI.deleteUser(key, org, crowdGroup)
          }
        }
      }
    }
  }

  function PeriodicAudit () {
    return functions.pubsub.schedule(period).onRun((context) => {
      AuditFromCrowdToGitHub()
    })
  }
  return {
    ManuallyAudit: AuditFromCrowdToGitHub,
    PeriodicAudit: PeriodicAudit
  }
};
