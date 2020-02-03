const admin = require('firebase-admin')
const functions = require('firebase-functions')
admin.initializeApp(functions.config().firebase)
const db = admin.firestore()

const Github = require('./lib/github')
const Cla = require('./lib/cla')

const cla = new Cla(db)

const github = new Github({
  id: functions.config().github.app_id,
  cert: functions.config().github.key,
  secret: functions.config().github.secret,
  cla: cla
})

exports.githubWebook = functions.https.onRequest(github.handler)

// Add functions in response to DB changes
// https://firebase.google.com/docs/firestore/extend-with-functions

// exports.modifyUser = functions.firestore
//   .document('clas/{claID}')
//   .onWrite((change) => {
//     // Get an object with the current document value.
//     // If the document does not exist, it has been deleted.
//     const document = change.after.exists ? change.after.data() : null
//
//     // Get an object with the previous document value (for update or delete)
//     // const oldDocument = change.before.toJson()
//
//     // Check to see if there are any outstanding PRs for newly added users
//     if (document) {
//       const whitelist = document.data().whitelist
//       console.log('rechecking', whitelist)
//       // TODO: re-enable once recheckPrsForEmails is fixed
//       // github.recheckPrsForEmails(whitelist)
//     }
//   })

/**
 * When a new addendum is created, update the list of active contributors in the parent agreement.
 */
exports.updateWhitelist = functions.firestore
  .document('/addendums/{id}')
  .onCreate(cla.updateWhitelist)
