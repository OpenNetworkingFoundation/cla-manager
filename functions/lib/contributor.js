module.exports = Contributor

/**
 * Returns Contributor-related functions.
 * @param db {FirebaseFirestore.Firestore}
 */
function Contributor (db) {
  /**
   * Given a snapshot of an addendum updates the set of active contributors in the parent agreement.
   * @param {DocumentSnapshot} snapshot of a new addendum
   * @returns {Promise}
   */
  async function updateActiveContributors (snapshot) {
    const newAddendumDoc = snapshot.data()
    const agreementRef = db.collection('agreements')
      .doc(newAddendumDoc.agreementId)
    // FIXME: there's no guarantee of total ordering
    return db.runTransaction(function (transaction) {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(agreementRef)
        .then(function (doc) {
          if (!doc.exists) {
            throw new Error('Missing agreement for given addendum')
          }
          const agreementDoc = doc.data()
          // Maintain separate sets, each one for each contributor identifier (email, github IDs, etc.).
          const activeEmails = getAsSet(agreementDoc, 'activeEmails')
          const activeGithubIds = getAsSet(agreementDoc, 'activeGithubIds')
          newAddendumDoc.added.forEach(user => {
            activeEmails.add(user.email)
            activeGithubIds.add(user.githubId)
          })
          newAddendumDoc.removed.forEach(user => {
            activeEmails.delete(user.email)
            activeGithubIds.delete(user.githubId)
          })
          const newData = {
            activeEmails: Array.from(activeEmails),
            activeGithubIds: Array.from(activeGithubIds)
          }
          transaction.update(agreementRef, newData)
          return newData
        })
    }).then(function (result) {
      console.debug('Transaction successfully committed!', result)
    }).catch(function (error) {
      console.error('Transaction failed: ', error, newAddendumDoc)
    })
  }

  return {
    updateActiveContributors: updateActiveContributors
  }
}

function getAsSet (doc, key) {
  if (Object.prototype.hasOwnProperty.call(doc, key)) {
    return new Set(doc[key])
  } else {
    return new Set()
  }
}
