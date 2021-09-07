const util = require('./util')
const functions = require('firebase-functions')
const logger = functions.logger
const AddendumType = {
  CONTRIBUTOR: 'contributor',
  MANAGER: 'manager'
}

module.exports = Cla

/**
 * Returns CLA-related functions.
 * @param db {FirebaseFirestore.Firestore}
 */
function Cla (db) {
  /**
   * Given a snapshot of a newly created addendum, updates the whitelist in the
   * parent agreement by replying all addendums in chronological order. If
   * snapshot is null, the implementation updates the whitelist for the
   * given agreementId.
   * @param addendumSnapshot {DocumentSnapshot|null} addendum snapshot
   * @param agreementId {string|null} agreement ID (if snapshot is null)
   * @returns {Promise}
   */
  async function updateWhitelist (addendumSnapshot, agreementId = null) {
    let newAddendum
    if (addendumSnapshot) {
      newAddendum = addendumSnapshot.data()
      agreementId = newAddendum.agreementId
    } else if (!agreementId) {
      throw new Error('Both addendumSnapshot and agreementId are null, which' +
        ' whitelist should I update?')
    } else {
      newAddendum = null
    }
    return db.collection('agreements').doc(agreementId).get()
      .then(agreement => {
        if (!agreement.exists) {
          return Promise.reject(new Error('Agreement does not exist'))
        }
        return db.collection('addendums')
          .where('agreementId', '==', agreementId)
          .orderBy('dateSigned')
          .get()
      })
      .then(addendumQuery => {
        return addendumQuery.docs.map(s => s.data())
          // When using the firestore emulator, query results don't always
          // include the latest writes, such as the new addendum. We manually
          // append it to the results to always pass the tests.
          .concat([newAddendum || { added: [], removed: [] }])
          .reduce((auth, addendum) => {
            if (addendum.type === AddendumType.CONTRIBUTOR) {
              addendum.added.map(util.identityKey).forEach(val => {
                auth.whitelist.add(val)
              })
              addendum.removed.map(util.identityKey).forEach(val => {
                auth.whitelist.delete(val)
              })
            } else if (addendum.type === AddendumType.MANAGER) {
              addendum.added.forEach(val => {
                auth.managers.add(val.value)
              })
              addendum.removed.forEach(val => {
                auth.managers.delete(val.value)
              })
            }
            return auth
          }, { whitelist: new Set(), managers: new Set() })
      })
      .then(auth => {
        // Store the whitelist using the same ID as the agreement.
        return db.collection('whitelists')
          .doc(agreementId)
          .set({
            lastUpdated: new Date(),
            values: Array.from(auth.whitelist),
            managers: Array.from(auth.managers)
          })
      })
      .then(writeResult => {
        logger.debug(`Successfully updated whitelist for agreement ${agreementId} `)
        return writeResult
      })
      .catch(error => {
        logger.debug(`Error while updating whitelist for agreement ${agreementId}`, error)
        return Promise.reject(error)
      })
  }

  /**
   * Given an identity it returns a boolean promise indicating whether the
   * identity is whitelisted or not.
   * @param identity {{..., type: string, value: string}}
   * @returns {Promise<boolean>}
   */
  async function isIdentityWhitelisted (identity) {
    return checkIdentities([identity]).then(r => r.allWhitelisted)
  }

  /**
   * Promises an object describing whether all given identities are
   * whitelisted, or not.
   * @param identities {{..., type: string, value: string}[]}
   * @returns {Promise<{allWhitelisted: boolean, missingIdentities: string[]}>}
   */
  async function checkIdentities (identities) {
    if (!Array.isArray(identities) || !identities.length) {
      logger.warn('undefined or empty identities')
      return Promise.resolve({
        allWhitelisted: false,
        missingIdentities: []
      })
    }

    let identityKeys
    try {
      identityKeys = identities.map(util.identityKey)
    } catch (e) {
      logger.warn(e)
      return Promise.resolve({
        allWhitelisted: false,
        missingIdentities: []
      })
    }

    // Each unique identity gets its own query. We could use `array-contains-in`
    // and reduce the number of queries, but we need to manage its limitations:
    // https://firebase.google.com/docs/firestore/query-data/queries#query_limitations
    const uniqueIdentities = Array.from(new Set(identityKeys))
    const queries = uniqueIdentities.map((identity) => db
      .collection('whitelists')
      .where('values', 'array-contains', identity)
      .get().then(function (query) {
        return {
          identity: identity,
          whitelisted: !query.empty
        }
      }))

    return Promise.all(queries)
      .then(result => {
        const missing = result.reduce((m, query) => {
          if (!query.whitelisted) {
            m.push(query.identity)
          }
          return m
        }, [])
        return {
          allWhitelisted: missing.length === 0,
          missingIdentities: missing
        }
      })
  }

  return {
    updateWhitelist: updateWhitelist,
    isIdentityWhitelisted: isIdentityWhitelisted,
    checkIdentities: checkIdentities
  }
}
