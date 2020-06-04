const Crowd = require('./Crowd.js')
const GitHubAPI = require('./Github_API.js')
const functions = require('firebase-functions')


module.exports = CrowdToGitHub
/**
 * Function to sync  functions.
 * @param crowdApp {string} crowd app name
 * @param crowdPassword {string} crowd app password
 * @param githubToken {string} Github Access token
 * @return {{getUsersWithGithubID: getUsersWithGithubID}}
 * @constructor
 */
function CrowdToGitHub(crowdApp, crowdPassword, githubToken) {
  //FIXME
  const crowdGroups = "members"
  //FIXME
  const githubTeams = [
    { org: "OpenNetworkingFoundation", team: "xxxx" }]


  async function AuditFromCrowdToGitHub() {
    const crowd = new Crowd(null, crowdApp, crowdPassword)
    const githubAPI = new GitHubAPI(githubToken)

    //1. Get all valid Users from Crowd serer (valid means the user has Github_id attribute)
    crowd_users = await crowd.getUsersWithGithubID(crowdGroups)

    //2. Iterate all github teams,
    for (const github of githubTeams) {
      //3. Get all users under github team
      github_users = await githubAPI.getUsers(github.org, github.team)

      //For All Crowd Users
      for (const [key, value] of Object.entries(crowd_users)) {
        // Add to Github if user is not in Github
        if (!(key in github_users)) {
          githubAPI.addUser(key, github.org, github.team)
        }
      }
      //For All Github Users
      for (const [key, value] of Object.entries(github_users)) {
        //Remove from Github if user is not in Crowd
        if (!(key in crowd_users)) {
          githubAPI.deleteUser(key, github.org, github.team)
        }
      }
    }

  }
  return {
    AuditFromCrowdToGitHub: AuditFromCrowdToGitHub,
  }
};
