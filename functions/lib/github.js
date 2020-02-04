import { Identity, IdentityType } from './common/model/identity'

const App = require('@octokit/app')
const Octokit = require('@octokit/rest')
const WebhooksApi = require('@octokit/webhooks')

// const debug = false
// const reqLogger = {
//  debug: debug ? () => {} : console.log,
//  info: debug ? () => {} : console.log,
//  warn: console.warn,
//  error: console.error
// }

module.exports = Github

/**
 *
 * @param appId {number}
 * @param privateKey {string}
 * @param secret {string}
 * @param clalib {Cla}
 * @constructor
 */
function Github (appId, privateKey, secret, clalib) {
  const ghApp = new App({ id: appId, privateKey: privateKey })
  // const jwt = app.getSignedJsonWebToken() // global app token
  const ghWebhooks = new WebhooksApi(secret ? { secret } : {})

  ghWebhooks.on('*', ({ id, name, payload }) => {
    console.log(name, 'event received')
  })

  ghWebhooks.on('error', (error) => {
    console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`)
  })

  ghWebhooks.on(
    [
      'pull_request.opened',
      'pull_request.synchronize'
    ], async context => {
      // TODO: check repo owner and discard if it's not managed by ONF
      const pr = context.payload.pull_request
      const owner = pr.base.repo.owner.login
      const repo = pr.base.repo.name
      const prNum = pr.number
      const eventType = context.payload.action
      const numCommits = pr.commits

      console.log(`Pull Request: ${owner}/${repo}/${prNum}, type ${eventType}, ${numCommits} commits`)

      const installationId = context.payload.installation.id
      const installationAccessToken = await ghApp.getInstallationAccessToken({ installationId })

      const ghClient = new Octokit({
        auth: installationAccessToken // jwt,
        // log: reqLogger //FIXME
      })

      const status = {
        owner: owner,
        repo: repo,
        context: 'clam',
        sha: pr.head.sha
      }

      // TODO if numCommits <= 250, use the commits_url or pull request list
      //  commits API else, use the repo commits API; can be an error for now
      if (numCommits > 250) {
        // Should post a status to the PR
        status.state = 'failure'
        status.target_url = 'https://sign.the.cla'
        status.description = 'Cannot evaluate CLA for this PR. ' +
          'Number of commits exceeds the 250 commit limit. ' +
          'Please contact contact support@opennetworking.org'
        return ghClient.repos.createStatus(status)
      }

      // We need a CLA in file for the PR author (github ID), as well as for all
      // the identities associated with all commits of this PR.
      const identities = getPrIdentities(pr, ghClient)

      return clalib.checkIdentities(identities).then(result => {
        if (result.allWhitelisted) {
          console.log('cla is signed for all commits')
          status.state = 'success'
          status.description = 'All good! We have a CLA in file for all contributors in this PR.'
        } else {
          let msg
          if (result.missingIdentities.length) {
            msg = 'We could not find a CLA for the following identities: ' +
              result.missingIdentities +
              '. You will need to sign one before we can merge your PR.'
          } else {
            msg = 'We were not able to verify the CLA for this PR. ' +
              'If the problem persists please contact support@opennetworking.org'
          }
          status.state = 'failure'
          status.target_url = 'https://sign.the.cla'
          status.description = msg
        }
        return ghClient.repos.createStatus(status)
      })
    })

  async function getPrIdentities (pr, ghClient) {
    // We need a CLA in file for the PR author (github ID), as well as for all
    // the identities associated with all commits of this PR.
    const identities = [new Identity(IdentityType.GITHUB, null, pr.user.login)]
    const responses = await ghClient.paginate.iterator(`GET ${pr.commits_url}`)
    for await (const response of responses) {
      response.data.map(commit => getCommitIdentities(commit))
        .forEach(x => identities.push(...x))
    }
    return identities
  }

  function getCommitIdentities (commit) {
    // FIXME this is a hack for storing PR toJson
    const match = commit.url.match(/repos\/([^/]+)\/([^/]+)/)
    const ref = {
      owner: match[1],
      repo: match[2],
      sha: commit.sha
    }
    console.log(ref)

    const identities = [
      new Identity(IdentityType.GITHUB, null, commit.author.login),
      new Identity(IdentityType.EMAIL, null, commit.commit.author.email)
    ]

    if (commit.committer.login !== 'web-flow') {
      identities.push(...[
        new Identity(IdentityType.GITHUB, null, commit.committer.login),
        new Identity(IdentityType.EMAIL, null, commit.commit.committer.email)
      ])
    }

    return identities
  }

  // function recheckPrsForEmails (emails) {
  //   console.log('rechecking:', emails)
  //   return Promise.all(emails.map(async email => {
  //     const refs = await claClient.getPrsForEmail(email)
  //     return refs.map(ref => {
  //       // FIXME This is a Hack that won't work if there is more than one commit
  //       return client.repos.createStatus({
  //         owner: ref.owner,
  //         repo: ref.repo,
  //         sha: ref.sha,
  //         context: 'cla-manager',
  //         state: 'success',
  //         description: 'CLA is signed'
  //       })
  //     })
  //   }))
  // }

  return {
    receive: ghWebhooks.receive,
    handler: ghWebhooks.middleware,
    getPrIdentities: getPrIdentities,
    getCommitIdentities: getCommitIdentities
    // recheckPrsForEmails
  }
}
