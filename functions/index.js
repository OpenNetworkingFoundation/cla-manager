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
 * When a new CLA validation event is created, e.g. by the GitHub webhook,
 * process it. The implementation is expected to update the status of the
 * contribution (e.g., GitHub PR) in the corresponding server and wait for an
 * ack. Event documents should be updated in the DB with an indication if the
 * ack was successful or if any error occurred.
 */
exports.handleEvent = functions.firestore
  .document('/events/{id}')
  .onCreate(snapshot => {
    const event = snapshot.data()
    if (!('provider' in event)) {
      return Promise.reject(new Error('missing provider key in request'))
    }
    if (event.provider === 'github') {
      return github.processEvent(snapshot)
    } else {
      return Promise.reject(new Error(`unknown request type ${event.type}`))
    }
  })

// TODO: implement cronjob function to periodically clean up acknowledged and
//  outdated events.

// TODO: implement logic to re-process any pending event every time the
//  whitelists collection is updated.
