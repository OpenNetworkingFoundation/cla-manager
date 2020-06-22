const Crowd = require('./crowd')
import { GithubLib } from './github'

module.exports = CrowdToGitHub

/**
 * Functions related to syncing Crowd state to Github.
 * @param groupMappings  group mapping config
 * @param crowdApp crowd app name
 * @param crowdPassword crowd app password
 * @param githubLib github lib instance
 * @constructor
 */
function CrowdToGitHub(groupMappings: any, crowdApp: string, crowdPassword: string, githubLib: GithubLib) {
  async function doAudit() {
    const crowd = new Crowd(null, crowdApp, crowdPassword)
    // Iterate all Crowd groups
    for (const [crowdGroup, values] of
      Object.entries<{ githubOrg: string, team: string }[]>(groupMappings)) {
      // Get all valid Users from Crowd serer (valid means the user has Github_id attribute)
      const crowdUsers = await crowd.getGithubIdsOfUsersInGroup(crowdGroup)
      console.log(`Crowd Users: ${JSON.stringify(crowdUsers)}`)
      // Iterate all github organization,
      for (const github of values) {
        console.log(`mapping from Crowd ${crowdGroup} to ${github.githubOrg}/${github.team}`)
        // Create the Team if necessary
        await githubLib.createTeam(github.githubOrg, github.team)

        // Get all users under github team
        const githubUsers = await githubLib.getUsers(github.githubOrg, github.team)
        console.log(`GitHub Users: ${JSON.stringify(githubUsers)}`)
        // For All Crowd Users
        for (const [key] of Object.entries(crowdUsers)) {
          // Add to Github if user is not in Github
          if (!(key in githubUsers)) {
            try {
              console.debug(`Adding ${key} to ${github.githubOrg}:${github.team}`)
              await githubLib.addUser(key, github.githubOrg, github.team)
            } catch (e) {
              console.error(`Adding ${key} to ${github.githubOrg}:${github.team} failed:` + e)
            }
          }
        }
        // For All Github Users
        for (const [key] of Object.entries(githubUsers)) {
          // Remove from Github if user is not in Crowd
          if (!(key in crowdUsers)) {
            try {
              console.debug(`Removing ${key} from ${github.githubOrg}:${github.team}`)
              await githubLib.deleteUser(key, github.githubOrg, github.team)
            } catch (e) {
              console.error(`Removing ${key} from ${github.githubOrg}:${github.team} failed:` + e)
            }
          }
        }
      }
    }
  }

  return {
    audit: doAudit
  }
}
