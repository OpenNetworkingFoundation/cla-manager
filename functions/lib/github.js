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
          identity: `github:${pr.user.login}`,
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

    // Check whitelist.
    const cla = Cla(db)
    try {
      if (await cla.isIdentityWhitelisted(util.identityObj(req.identity))) {
        req.lastStatus.state = 'success'
        req.lastStatus.description = `All good! We have a CLA in file for @${pr.user.login}`
      } else {
        req.lastStatus.state = 'failure'
        req.lastStatus.description = `We don't have a CLA in file for @${pr.user.login}`
        req.lastStatus.comment = `Hi @${pr.user.login}, ` +
          'this is the ONF bot 🤖 I\'m glad you want to contribute to ' +
          'our projects! However, before accepting your contribution, ' +
          'we need to ask you to sign a Contributor License Agreement ' +
          '(CLA). You can do it online, it will take only few minutes:' +
          '\n\n✒️ 👉 https://cla.opennetworking.org\n\n' +
          'After signing, make sure to add your Github user ID ' +
          `\`${pr.user.login}\` to the agreement.`
      }
    } catch (error) {
      console.error(error)
      req.lastStatus.state = 'error'
      req.lastStatus.description = 'cannot check whitelist'
    }

    // If any error occurred, improve user experience by posting a comment.
    if (req.lastStatus.state === 'error' && !req.lastStatus.comment) {
      req.lastStatus.comment =
        `Unable to verify CLA: ${req.lastStatus.description}. ` +
        'If the problem persists, please contact support@opennetworking.org ' +
        ` (\`support-id: ${requestSnapshot.id}\`)`
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

  // We agreeed to validate just the PR author. No need to extract identities.
  // async function getPrIdentities (pr, octokit) {
  //   // We need a CLA in file for the PR author (github ID), as well as for
  // all // the identities associated with all commits of this PR. const
  // identities = [`github:${pr.user.login}`] const responses = await
  // octokit.paginate.iterator(`GET ${pr.commits_url}`) for await (const
  // response of responses) { response.data.map(commit =>
  // getCommitIdentities(commit)) .forEach(x => identities.push(...x)) } return
  // Array.from(new Set(identities)) }  function getCommitIdentities (commit) {
  // const identities = [ `github:${commit.author.login}`,
  // `email:${commit.commit.author.email}` ] if (commit.committer.login !==
  // 'web-flow') { identities.push(...[ `github:${commit.committer.login}`,
  // `email:${commit.commit.committer.email}` ]) } return Array.from(new
  // Set(identities)) }

  return {
    receive: ghWebhooks.receive,
    handler: ghWebhooks.middleware,
    processRequest: processRequest
    // getPrIdentities: getPrIdentities,
    // getCommitIdentities: getCommitIdentities
  }
}
