const functions = require('firebase-functions')

const Github = require('./github')
const Cla = require('./cla')

const github = new Github({
  id: functions.config().github.app_id,
  cert: functions.config().github.key,
  secret: functions.config().github.secret,
  cla: new Cla()
})

exports.githubWebook = functions.https.onRequest(github.handler)

// Add functions in response to DB changes
// https://firebase.google.com/docs/firestore/extend-with-functions

exports.modifyUser = functions.firestore
  .document('clas/{claID}')
  .onWrite((change, context) => {
    // Get an object with the current document value.
    // If the document does not exist, it has been deleted.
    const document = change.after.exists ? change.after.data() : null

    // Get an object with the previous document value (for update or delete)
    // const oldDocument = change.before.toJson()

    // Check to see if there are any outstanding PRs for newly added users
    if (document) {
      const whitelist = document.data().whitelist
      console.log('rechecking', whitelist)
      // TODO: re-enable once recheckPrsForEmails is fixed
      // github.recheckPrsForEmails(whitelist)
    }
  })
