const util = require('./util')
const Cla = require('./cla')
const App = require('@octokit/app')
const { Octokit } = require('@octokit/rest')
const WebhooksApi = require('@octokit/webhooks')
const sha1 = require('sha1')

module.exports = Github

/**
 * Github-related functions.
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
      'pull_request.synchronize',
      'pull_request.closed'
    ], context => {
      // Store event int the db. We'll process it later.
      // TODO: check repo owner and discard if it's not managed by ONF
      const pr = context.payload.pull_request
      const contributionKey = `github.com/${pr.base.repo.full_name}/pull/${pr.number}`
      const contributionId = sha1(contributionKey)
      const contributionRef = db.collection('contributions').doc(contributionId)
      const action = context.payload.action

      let contribPromise
      if (action === 'opened' || action === 'reopened') {
        contribPromise = contributionRef.set({
          key: contributionKey,
          provider: 'github',
          project: pr.base.repo.full_name,
          type: 'pull_request'
        })
      } else {
        // if synchronize, we should already have a doc in the DB.
        contribPromise = Promise.resolve()
      }

      if (action !== 'closed') {
        // Store payload in db and process later.
        return contribPromise
          .then(async () => db.collection('events').add({
            contributionId: contributionId,
            contributionKey: contributionKey,
            provider: 'github',
            type: 'pull_request.' + action,
            payload: context.payload,
            createdOn: new Date()
          }))
          .catch(console.error)
      } else {
        // Delete contribution doc.
        return contributionRef.delete()
          .catch(console.error)
      }
    })

  /**
   * Process an event from the database.
   * @param eventSnapshot {DocumentSnapshot}
   * @returns {Promise}
   */
  async function processEvent (eventSnapshot) {
    const event = eventSnapshot.data()

    console.log(`eventId=${eventSnapshot.id}, contributionKey=${event.contributionKey}, event=${event.type}`)

    const pr = event.payload.pull_request
    const installationId = event.payload.installation.id
    const accessToken = await ghApp.getInstallationAccessToken({ installationId })
    const octokit = new Octokit({ auth: accessToken })

    // Info to post to GitHub.
    const status = {
      state: null, // error, failure, success
      description: null, // max 140 characters
      comment: null // pull request comment
    }

    // Check whitelist
    event.identity = `github:${pr.user.login}`
    try {
      if (await Cla(db).isIdentityWhitelisted(util.identityObj(event.identity))) {
        status.state = 'success'
        status.description = `All good! We have a CLA in file for @${pr.user.login}`
      } else {
        status.state = 'failure'
        status.description = `We don't have a CLA in file for @${pr.user.login}`
        status.comment = `Hi @${pr.user.login}, ` +
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
      status.state = 'error'
      status.description = 'cannot check whitelist'
    }

    // If any error occurred, improve user experience by posting a comment.
    if (status.state === 'error' && !status.comment) {
      status.comment =
        `Unable to verify CLA: ${status.description}. ` +
        'If the problem persists, please contact support@opennetworking.org ' +
        ` (\`support-id: ${eventSnapshot.id}\`)`
    }

    // Post status to Github and update event in the DB
    const statusPromise = octokit.repos
      .createStatus({
        owner: pr.base.repo.owner.login,
        repo: pr.base.repo.name,
        context: 'onf/cla',
        sha: pr.head.sha,
        target_url: 'https://cla.opennetworking.org',
        description: status.description,
        state: status.state
      })
      .then(() => {
        status.githubAck = true
      })
      .catch(error => {
        status.githubAck = false
        status.githubError = JSON.parse(JSON.stringify(error))
      })
      .then(() => {
        event.status = status
        return eventSnapshot.ref.update(event)
      })
      .catch(console.error)

    const contribRef = db.collection('contributions')
      .doc(event.contributionId)
    const commentPromise = contribRef.get()
      .then(snapshot => {
        // Retrieve existing comment_id (if any)
        if (!snapshot.exists) {
          console.error(`Missing contribution ${event.contributionId} in DB`)
          return null
        } else {
          return snapshot.data().githubCommentId
        }
      })
      .then(commentId => {
        const commentData = {
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          issue_number: pr.number
        }
        if (status.comment) {
          // Create or update existing comment.
          commentData.body = status.comment
          if (commentId) {
            commentData.comment_id = commentId
            return octokit.issues.updateComment(commentData)
          } else {
            return octokit.issues.createComment(commentData)
          }
        } else if (commentId) {
          // Delete existing comment.
          commentData.comment_id = commentId
          return octokit.issues.deleteComment(commentData)
        }
      })
      .then(response => {
        // Update comment ID in contribution doc
        let commentId
        switch (response.status) {
          case 201:
            // Comment created
            commentId = response.data.id
            break
          case 204:
            // Comment deleted
            commentId = null
            break
          default:
            return Promise.resolve()
        }
        return contribRef.update({
          githubCommentId: commentId
        })
      })
      .catch(console.error)

    return Promise.all([statusPromise, commentPromise])
      .catch(console.error)
  }

  return {
    receive: ghWebhooks.receive,
    handler: ghWebhooks.middleware,
    processEvent: processEvent
  }
}
