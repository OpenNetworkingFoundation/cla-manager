var http = require('https');
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




async function GetGitHubUser(options, org, team) {
  return new Promise(function (resolve, reject) {
    options['path'] = '/orgs/' + org + '/teams/' + team + '/members';
    let data = '';
    var request = http.request(options,
      function (response) {
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          users = {}
          for (user of JSON.parse(data)) {
            users[user.login] = true
          }
          resolve(users);
        });
      }).end();
  })
}


/**
 * Github-related functions.
 * @param crowd_group {string}
 * @param crowd_hostname {string}
 * @param crowd_auth {string}
 * @param github_auth {string}
 * @param github_orgs {array of object{org,team}}
 * @constructor
 */
async function CrowdToGithub(crowd_group, crowd_hostname, crowd_auth, github_auth, github_orgs) {
  var github_options = {
    'hostname': 'api.github.com',
    'port': 443,
    'headers': {
      'Accept': 'application/json',
      'Authorization': 'token ' + github_auth,
      'User-Agent': 'Awesome-Octocat-App'
    },
  };



  for (const github of github_orgs) {
    let github_users = await GetGitHubUser(github_options, github.org, github.team)
    //console.log(g_users)

    //For All Crowd Users
    for (const [key, value] of Object.entries(crowd_users)) {
      //Pass it user already in Github
      if (key in github_users) {
        continue;
      } else {
        //Add to Github
        console.log("Add " + key + " to github " + github.org + "/" + github.team)
      }
    }
    //For All Github Users
    for (const [key, value] of Object.entries(github_users)) {
      //Remove from Github if user is not in Crowd
      if (!(key in crowd_users)) {
        console.log("Remove " + key + " from github " + github.org + "/" + github.team)
      }
    }

  }

}