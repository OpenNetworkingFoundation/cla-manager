module.exports = Contributor

/**
 * Returns Contributor-related functions.
 * @param db {FirebaseFirestore.Firestore}
 */
function Contributor (db) {
  /**
   * Given a snapshot of a newly created addendum, updates the set of active
   * contributors in the parent agreement by replying all addendums in
   * chronological order.
   * @param {DocumentSnapshot} snapshot of a new addendum
   * @returns {Promise}
   */
  async function updateActiveContributors (snapshot) {
    const newAddendumDoc = snapshot.data()
    const agreementId = newAddendumDoc.agreementId
    return db.collection('addendums')
      .where('agreementId', '==', agreementId)
      .orderBy('dateSigned')
      .get().then(function (query) {
        const emails = new Set()
        const githubIds = new Set()
        query.docs.map(s => s.data())
          // When using the firestore emulator, query results don't always
          // include the latest writes, such as the new addendum. We manually
          // append it to the results to always pass the tests.
          .concat([newAddendumDoc])
          .forEach(function (addendum) {
            addendum.added.forEach(user => {
              emails.add(user.email)
              githubIds.add(user.githubId)
            })
            addendum.removed.forEach(user => {
              emails.delete(user.email)
              githubIds.delete(user.githubId)
            })
          })
        return db.collection('agreements')
          .doc(newAddendumDoc.agreementId)
          .update({
            activeEmails: Array.from(emails),
            activeGithubIds: Array.from(githubIds),
            lastUpdated: new Date()
          })
      })
      .then(function (result) {
        console.debug('Agreement successfully updated!', {
          agreementId: agreementId
        })
      })
  }

  return {
    updateActiveContributors: updateActiveContributors
  }
}
