const admin = require('firebase-admin')
const functions = require('firebase-functions')
const Github = require('./lib/github')
const Cla = require('./lib/cla')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()

const clalib = new Cla(db)
const github = new Github(
  functions.config().github.app_id,
  functions.config().github.key,
  functions.config().github.secret,
  db)

/**
 * When a new addendum is created, update the whitelists collection with the
 * list of allowed identities for the parent agreement.
 */
exports.updateWhitelist = functions.firestore
  .document('/addendums/{id}')
  .onCreate(clalib.updateWhitelist)

/**
 * Handles GitHub pull requests and other events. For pull requests, the
 * implementation is expected to create a new request document in the DB, which
 * will be picked up by the below function.
 */
exports.githubWebook = functions.https.onRequest(github.handler)

/**
 * When a new CLA validation request is created, e.g. by the GitHub webhook,
 * process it. The implementation is expected to update the status of the
 * contribution (e.g., GitHub PR) in the corresponding server and wait for an
 * ack. Request documents should be updated in the DB with an indication if the
 * ack was successful or if any error occurred.
 */
exports.handleRequest = functions.firestore
  .document('/requests/{id}')
  .onCreate(snapshot => {
    if (!snapshot.exists) {
      return Promise.reject(new Error('snapshot does not exist'))
    }
    const request = snapshot.data()
    if (!('type' in request)) {
      return Promise.reject(new Error('missing type key in request'))
    }
    if (request.type === 'github') {
      return github.processRequest(snapshot)
    } else {
      return Promise.reject(new Error(`unknown request type ${request.type}`))
    }
  })

// TODO: implement cronjob function to periodically clean up acknowledged and
//  outdated requests.

// TODO: implement logic to re-process any pending request every time the
//  whitelists collection is updated.
