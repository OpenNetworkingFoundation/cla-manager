module.exports = Contributor

/**
 * Returns Contributor-related functions.
 * @param db {FirebaseFirestore.Firestore}
 */
function Contributor (db) {
  /**
   * Given a new addendum, updates the set of active contributors in the parent agreement.
   * @param {DocumentSnapshot} snapshot of a new addendum
   * @returns {Promise<T>}
   */
  async function updateActiveContributors (snapshot) {
    const newAddendumDoc = snapshot.data()
    const agreementRef = db.collection('agreements')
      .doc(newAddendumDoc.agreementId)
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
          transaction.update(agreementRef, {
            activeEmails: Array.from(activeEmails),
            activeGithubIds: Array.from(activeGithubIds)
          })
        })
    }).then(function () {
      console.info('Transaction successfully committed!', newAddendumDoc)
    }).catch(function (error) {
      console.error('Transaction failed: ', error, newAddendumDoc)
    })
  }

  function getAsSet (doc, key) {
    if (Object.prototype.hasOwnProperty.call(doc, key)) {
      return new Set(doc[key])
    } else {
      return new Set()
    }
  }

  return {
    updateActiveContributors: updateActiveContributors
  }
}
