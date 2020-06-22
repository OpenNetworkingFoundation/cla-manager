import Firestore, {DocumentSnapshot} from "@google-cloud/firestore/build/src";
import {CallableContext} from "firebase-functions/lib/providers/https";
import * as http from "http";

const util = require('./util')
const Cla = require('./cla')
const App = require('@octokit/app')
const {Octokit} = require('@octokit/rest')
const WebhooksApi = require('@octokit/webhooks')
const {request} = require('@octokit/request')
const sha1 = require('sha1')
const functions = require('firebase-functions')

// TODO (carmelo): Rework Github library to be a class. This is a temporary
//  workaround to get a type for the Github library to be used in other libs.
export interface GithubLib {
  receive: (options: { id: string; name: string; payload: any }) => Promise<void>;
  handler: (request: http.IncomingMessage, response: http.ServerResponse, next?: (err?: any) => void) => (void | Promise<void>);
  processEvent: (eventSnapshot: DocumentSnapshot) => Promise<unknown[] | void>;
  setAppUserAccount: (data: { token: string }, context: CallableContext) => Promise<string | Uint8Array>;
  getUsers: (org: string, team: string) => Promise<string[]>;
  addUser: (githubID: string, org: string, team: string) => Promise<void>;
  deleteUser: (githubID: string, org: string, team: string) => Promise<void>;
  createTeam: (org: string, name: string) => Promise<void>;
}

/**
 * Github-related functions.
 * @param appId {number} GitHub app ID
 * @param privateKey {string} GitHub app private key
 * @param secret {string} GitHub app secret
 * @param db {firebase.Firestore}
 * @constructor
 */
export function Github(appId: string, privateKey: string, secret: string, db: Firestore) {
  const ghHostname = 'github.com'
  const ghApp = new App({
    id: appId,
    // Key is passed as a firebase config string with new lines encoded as "\n".
    // We need to replace "\n" with actual new line characters.
    privateKey: privateKey.replace(/\\n/g, '\n')
  })
  // const jwt = app.getSignedJsonWebToken() // global app token
  const ghWebhooks = new WebhooksApi(secret ? {secret} : {})

  ghWebhooks.on(
    [
      'pull_request.opened',
      'pull_request.reopened',
      'pull_request.synchronize',
      'pull_request.closed'
    ], (context: any) => {
      // Store event int the db. We'll process it later.
      // TODO: check repo owner and discard if it's not managed by ONF
      const pr = context.payload.pull_request
      const contributionKey = `${ghHostname}/${pr.base.repo.full_name}/pull/${pr.number}`
      const contributionId = sha1(contributionKey)
      const contributionRef = db.collection('contributions').doc(contributionId)
      const action = context.payload.action

      console.log(`contributionKey=${contributionKey}, event=pull_request.${action}, sha=${pr.head.sha}, contributionId=${contributionId}`)

      let contribPromise: Promise<void>
      if (action === 'opened' || action === 'reopened') {
        contribPromise = contributionRef.set({
          key: contributionKey,
          provider: 'github',
          project: pr.base.repo.full_name,
          type: 'pull_request'
        }).then(() => Promise.resolve())
      } else {
        // if synchronize, we should already have a doc in the DB.
        contribPromise = Promise.resolve()
      }

      if (action !== 'closed') {
        // Store payload in db and process later.
        return contribPromise
          .then(() => db.collection('events').add({
            contributionId: contributionId,
            contributionKey: contributionKey,
            provider: 'github',
            type: 'pull_request.' + action,
            payload: context.payload,
            createdOn: new Date()
          }))
          .then(result => {
            console.log(`created event eventId=${result.id}`)
          })
          .catch(console.error)
      } else {
        // Delete contribution doc.
        return contributionRef.delete()
          .catch(console.error)
      }
    })

  /**
   * Process an event from the database.
   * @param eventSnapshot
   * @returns {Promise}
   */
  async function processEvent(eventSnapshot: DocumentSnapshot) {
    const event = eventSnapshot.data() as any

    console.log(`eventId=${eventSnapshot.id}, contributionKey=${event.contributionKey}, event=${event.type}`)

    const pr = event.payload.pull_request
    const installationId = event.payload.installation.id
    const accessToken = await ghApp.getInstallationAccessToken({installationId})
    const octokit = new Octokit({auth: accessToken})

    // Info to post to GitHub.
    const status = {
      state: '', // error, failure, success
      description: '', // max 140 characters
      comment: '', // pull request comment
      githubAck: false, // whether the status was updated on github
      githubError: JSON
    }

    // Check whitelist
    event.identity = util.identityKey({
      type: 'github',
      value: pr.user.login
    })
    try {
      if (await Cla(db).isIdentityWhitelisted(util.identityObj(event.identity))) {
        status.state = 'success'
        status.description = `All good! We have a CLA on file for @${pr.user.login}`
      } else {
        status.state = 'failure'
        status.description = `We don't have a CLA on file for @${pr.user.login}`
        status.comment = `Hi @${pr.user.login}, ` +
          'this is the ONF bot 🤖 I\'m glad you want to contribute to ' +
          'our projects! However, before accepting your contribution, ' +
          'we need to ask you to sign a Contributor License Agreement ' +
          '(CLA). You can do it online, it will take only a few minutes:' +
          '\n\n✒️ 👉 https://cla.opennetworking.org\n\n' +
          'After signing, make sure to add your Github user ID ' +
          `\`${pr.user.login}\` to the agreement.` +
          '\n\nFor more information or help:"\n' +
          'https://wiki.opennetworking.org/x/BgCUI'
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
      .catch((error: any) => {
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
      .then((snapshot: DocumentSnapshot<any>) => {
        // Retrieve existing comment_id (if any)
        if (!snapshot.exists) {
          console.warn(`Missing contribution ${event.contributionId} in DB`)
          return ''
        } else {
          return snapshot.data().githubCommentId
        }
      })
      .then((commentId: string) => {
        const commentData = {
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          issue_number: pr.number,
          body: '',
          comment_id: ''
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
        return Promise.resolve()
      })
      // @ts-ignore
      .then(response => {
        if (!response) {
          // We didn't post any comment
          return Promise.resolve()
        }
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

  /**
   * Retrieves the Github user profile info associated with the given personal
   * access token, and updates the DB if successful.
   *
   * This function can be called from the client.
   *
   * @param data github personal access token
   * @param context firebase context
   * @return {string} account document ID
   */
  async function setAppUserAccount(data: { token: string }, context: CallableContext) {
    // Checking that the Firebase user is authenticated.
    if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('permission-denied',
        'The function must be called while authenticated')
    }
    const firebaseUid = context.auth.uid
    const userToken = data.token
    const octokit = new Octokit({auth: userToken})

    try {
      // Get user info using provided personal access token.
      const info = await octokit.users.getAuthenticated()
      const result = {
        hostname: ghHostname,
        key: info.data.id,
        username: info.data.login,
        active: true,
        name: info.data.name,
        email: info.data.email,
        updatedOn: new Date()
      }
      // Update db.
      const accountDocId = sha1(`${ghHostname}${result.key}`)
      await db.collection('appUsers')
        .doc(firebaseUid)
        .collection('accounts')
        .doc(accountDocId)
        .set(result)
      return accountDocId
    } catch (e) {
      console.log(e)
      throw new functions.https.HttpsError('internal',
        'An internal error occurred while evaluating the request')
    }
  }

  /**
   * TODO comment
   */
  async function getInstallationToken(org: string) {
    const jwt = ghApp.getSignedJsonWebToken()

    // Experimental API to get the installation ID for an organization
    // https://developer.github.com/v3/apps/#get-an-organization-installation-for-the-authenticated-app
    const {data} = await request('GET /orgs/:org/installation', {
      org,
      headers: {
        authorization: `Bearer ${jwt}`,
        accept: 'application/vnd.github.machine-man-preview+json'
      }
    })
    const installationId = data.id
    // TODO: we should cache the org -> installationId mapping to prevent repeated requests

    return await ghApp.getInstallationAccessToken({
      installationId
    })
  }

  async function getApi(org: string) {
    const installationToken = await getInstallationToken(org)
    // const auth = createTokenAuth(installationToken);
    // const authentication = await auth();
    return new Octokit({
      auth: installationToken
    })
  }

  /**
   * Fetch user list from a GitHub Team
   * @param org {string} organization name
   * @param team {string} team name
   * @return {list} user list
   */
  async function getUsers(org: string, team: string): Promise<string[]> {
    const octokit = await getApi(org)
    const validUsers = new Set<string>()
    try {
      // Get in-team users
      const {data: users} = await octokit.teams.listMembersInOrg({
        org: org,
        team_slug: team
      })
      for (const user of users) {
        validUsers.add(user.login)
      }
      // Get Pending users
      const {data: pendingUsers} = await octokit.teams.listPendingInvitationsInOrg({
        org: org,
        team_slug: team
      })
      for (const user of pendingUsers) {
        validUsers.add(user.login)
      }
    } catch (e) {
      throw new Error('Fetching user list failed:' + e)
    }
    return Array.from(validUsers)
  }

  /**
   * Add a GitHub user into a GitHub Team
   * @param githubID {string} GitHub user ID
   * @param org {string} GitHub organization name
   * @param team {string} GitHub team name
   */
  async function addUser(githubID: string, org: string, team: string):
    Promise<void> {
    const octokit = await getApi(org)
    try {
      await octokit.teams.addOrUpdateMembershipInOrg({
        org: org,
        team_slug: team,
        username: githubID
      })
    } catch (e) {
      throw new Error('Adding user failed:' + e)
    }
  }

  /**
   * Delete a GitHub user from a GitHub Team
   * @param githubID {string} GitHub user ID
   * @param org {string} GitHub organization name
   * @param team  {string} GitHub team name
   */
  async function deleteUser(githubID: string, org: string, team: string):
    Promise<void> {
    const octokit = await getApi(org)
    try {
      await octokit.teams.removeMembershipInOrg({
        org: org,
        team_slug: team,
        username: githubID
      })
    } catch (e) {
      throw new Error('Deleting user failed:' + e)
    }
  }

  /**
   * Create a GitHub Team if it does not exist
   * @param org {string} GitHub organization name
   * @param name {string} GitHub team name
   */
  async function createTeam(org: string, name: string): Promise<void> {
    const octokit = await getApi(org)
    try {
      let check = false
      const {data: teams} = await octokit.teams.list({
        org: org
      })

      // Check the existence
      for (const team of teams) {
        if (team.name === name) {
          check = true
          break
        }
      }

      // Create if necessary
      if (!check) {
        await octokit.teams.create({
          org: org,
          name: name
        })
      }
    } catch (e) {
      throw new Error('Creating team failed:' + e)
    }
  }

  return <GithubLib>{
    receive: ghWebhooks.receive,
    handler: ghWebhooks.middleware,
    processEvent: processEvent,
    setAppUserAccount: setAppUserAccount,
    getUsers: getUsers,
    addUser: addUser,
    deleteUser: deleteUser,
    createTeam: createTeam
  }
}
