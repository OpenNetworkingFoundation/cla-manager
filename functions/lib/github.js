const util = require('./util')
const Cla = require('./cla')
const App = require('@octokit/app')
const Octokit = require('@octokit/rest')
const WebhooksApi = require('@octokit/webhooks')

module.exports = Github

/**
 *
 * @param appId {number}
 * @param privateKey {string}
 * @param secret {string}
 * @param db {FirebaseFirestore.Firestore}
 * @constructor
 */
function Github (appId, privateKey, secret, db) {
  const ghApp = new App({
    id: appId,
    // Key is passed as a firebase config string with new lines encoded as "\n".
    // We need to replace "\n" with actual new line characters.
    privateKey: privateKey.replace(/\\n/g, '\n')
  })
  // const jwt = app.getSignedJsonWebToken() // global app token
  const ghWebhooks = new WebhooksApi(secret ? { secret } : {})

  ghWebhooks.on(
    [
      'pull_request.opened',
      'pull_request.reopened',
      'pull_request.synchronize'
    ], context => {
      // Store request to the db. We'll process it later.
      // TODO: check repo owner and discard if it's not managed by ONF
      // TODO: create a request model
      const pr = context.payload.pull_request
      return db.collection('requests')
        .add({
          contributionId: `github.com/${pr.base.repo.full_name}/pull/${pr.number}`,
          receivedOn: new Date(),
          type: 'github',
          event: 'pull_request.' + context.payload.action,
          payload: context.payload,
          app: {
            installationId: context.payload.installation.id
          },
          identities: null,
          lastStatus: null,
          lastProcessedOn: null,
          processedCount: 0
        })
        .catch(error => {
          console.error(error)
        }).finally()
    })

  /**
   * Process a request from the database.
   * @param requestSnapshot {DocumentSnapshot}
   * @returns {Promise}
   */
  async function processRequest (requestSnapshot) {
    const req = requestSnapshot.data()
    console.log(`contributionId=${req.contributionId}, event=${req.event}, receivedOn=${req.receivedOn}`)

    const pr = req.payload.pull_request

    const installationId = req.app.installationId
    const accessToken = await ghApp.getInstallationAccessToken({ installationId })
    const octokit = new Octokit({ auth: accessToken })

    // Status to post to GitHub. We need to determine a state and a description.
    req.lastStatus = {
      owner: pr.base.repo.owner.login,
      repo: pr.base.repo.name,
      context: 'onf/cla: validation',
      sha: pr.head.sha,
      target_url: 'https://cla.opennetworking.org',
      description: null, // Max 140 characters
      comment: null,
      state: null
    }
    req.lastProcessedOn = new Date()
    req.processedCount = req.processedCount + 1

    // Extract identities (if it's the first we process this request)
    if (!req.identities) {
      if (pr.commits > 250) {
        // TODO if numCommits <= 250, use the commits_url or pull request list
        //  commits API else, use the repo commits API; can be an error for now
        req.lastStatus.state = 'error'
        req.lastStatus.description = 'number of commits exceed the 250 limit'
      } else {
        try {
          req.identities = await getPrIdentities(pr, octokit)
        } catch (error) {
          console.error(error)
          req.lastStatus.state = 'error'
          req.lastStatus.description = 'internal error'
        }
      }
    }

    // If we managed to extract identities (state is not error), verify that all
    // identities are whitelisted.
    if (!req.lastStatus.state) {
      if (Array.isArray(req.identities) && req.identities.length > 0) {
        // Check whitelist.
        const cla = Cla(db)
        try {
          const checkResult = await cla.checkIdentities(
            req.identities.map(util.identityObj))
          if (checkResult.allWhitelisted) {
            req.lastStatus.state = 'success'
            req.lastStatus.description = 'all good!'
          } else {
            if (checkResult.missingIdentities.length) {
              req.lastStatus.state = 'failure'
              req.lastStatus.description = 'we could not find a CLA for all or some of the identities'
              req.lastStatus.comment =
                'We could not find a CLA for the following identities: ' +
                checkResult.missingIdentities.join(', ') +
                '. You will need to sign one before we can accept this contribution.'
            } else {
              req.lastStatus.state = 'error'
              req.lastStatus.description = 'whitelist verification failed but missing identities is empty'
            }
          }
        } catch (error) {
          console.error(error)
          req.lastStatus.state = 'error'
          req.lastStatus.description = 'cannot check whitelist'
        }
      } else if (Array.isArray(req.identities)) {
        req.lastStatus.state = 'error'
        req.lastStatus.description = 'empty identities'
      } else {
        req.lastStatus.state = 'error'
        req.lastStatus.description = 'invalid identities'
      }
    }

    // We should have a state to report by now.
    if (!req.lastStatus.state) {
      req.lastStatus.state = 'error'
      req.lastStatus.description = 'internal error'
    }

    // If any error occurred, improve description shown to user.
    if (req.lastStatus.state === 'error' && !req.lastStatus.comment) {
      req.lastStatus.comment =
        `Unable to verify CLA: ${req.lastStatus.description}. ` +
        'If the problem persists, please contact support@opennetworking.org.'
    }

    // Post status to Github.
    try {
      const octoResponse = await octokit.repos.createStatus(req.lastStatus)
      req.lastStatus.octoAck = octoResponse.status === 201
      req.lastStatus.octoResponse = {
        status: octoResponse.status,
        data: octoResponse.data
      }
    } catch (e) {
      req.lastStatus.octoAck = false
      req.lastStatus.octoError = JSON.parse(JSON.stringify(e))
    }

    // If error or failure, post comment
    if (req.lastStatus.state !== 'success') {
      try {
        const octoResponse = await octokit.issues.createComment({
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          issue_number: pr.number,
          body: req.lastStatus.comment
        })
        if (octoResponse.status !== 201) {
          console.error(octoResponse.data)
        }
      } catch (e) {
        console.error(e)
      }
    }

    // Finally, update request in the db.
    return requestSnapshot.ref.update(req)
      .catch(error => {
        console.log(error)
        return Promise.reject(error)
      })
  }

  async function getPrIdentities (pr, octokit) {
    // We need a CLA in file for the PR author (github ID), as well as for all
    // the identities associated with all commits of this PR.
    const identities = [`github:${pr.user.login}`]
    const responses = await octokit.paginate.iterator(`GET ${pr.commits_url}`)
    for await (const response of responses) {
      response.data.map(commit => getCommitIdentities(commit))
        .forEach(x => identities.push(...x))
    }
    return Array.from(new Set(identities))
  }

  function getCommitIdentities (commit) {
    const identities = [
      `github:${commit.author.login}`,
      `email:${commit.commit.author.email}`
    ]
    if (commit.committer.login !== 'web-flow') {
      identities.push(...[
        `github:${commit.committer.login}`,
        `email:${commit.commit.committer.email}`
      ])
    }
    return Array.from(new Set(identities))
  }

  return {
    receive: ghWebhooks.receive,
    handler: ghWebhooks.middleware,
    processRequest: processRequest,
    getPrIdentities: getPrIdentities,
    getCommitIdentities: getCommitIdentities
  }
}
