const Crowd = require('./crowd.js')

module.exports = CrowdToGitHub
/**
 * Function to sync  functions.
 * @param crowdApp {string} crowd app name
 * @param crowdPassword {string} crowd app password
 * @param githubToken {string} Github Access token
 * @return {{getUsersWithGithubID: getUsersWithGithubID}}
 * @constructor
 */
function CrowdToGitHub (groupMappings, crowdApp, crowdPassword, githubObj) {
  async function AuditFromCrowdToGitHub () {
    const crowd = new Crowd(null, crowdApp, crowdPassword)
    // Iterate all Crowd groups
    for (const [crowdGroup, value] of Object.entries(groupMappings)) {
      // Get all valid Users from Crowd serer (valid means the user has Github_id attribute)
      const crowdUsers = await crowd.getUsersWithGithubID(crowdGroup)
      // Iterate all github organization,
      for (const github of value) {
        console.log(`mapping from Crowd ${crowdGroup} to ${github.githubOrg}/${github.team}`)
        // Create the Team if necessary
        await githubObj.createTeam(github.githubOrg, github.team)

        // Get all users under github team
        const githubUsers = await githubObj.getUsers(github.githubOrg, github.team)
        // For All Crowd Users
        for (const [key] of Object.entries(crowdUsers)) {
          // Add to Github if user is not in Github
          if (!(key in githubUsers)) {
            githubObj.addUser(key, github.githubOrg, github.team)
          }
        }
        // For All Github Users
        for (const [key] of Object.entries(githubUsers)) {
          // Remove from Github if user is not in Crowd
          if (!(key in crowdUsers)) {
            githubObj.deleteUser(key, github.githubOrg, github.team)
          }
        }
      }
    }
  }

  return {
    ManuallyAudit: AuditFromCrowdToGitHub
  }
};
