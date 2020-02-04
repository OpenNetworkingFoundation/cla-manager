module.exports = Cla

/**
 * Returns CLA-related functions.
 * @param db {FirebaseFirestore.Firestore}
 */
function Cla (db) {
  /**
   * Returns a string that uniquely identifies the given identity object.
   * @param identity {{type: string, value: string}}
   * @returns {string|boolean}
   */
  function identityKey (identity) {
    if (!identity) {
      return false
    }
    if (!('type' in identity) || !('value' in identity)) {
      console.warn('Identity must have at least a type, and a value')
      return false
    }
    const lcValue = identity.value.toLowerCase()
    return `${identity.type}:${lcValue}`
  }

  /**
   * Given a snapshot of a newly created addendum, updates the whitelist in the
   * parent agreement by replying all addendums in chronological order.
   * @param {DocumentSnapshot} addendumSnapshot of a new addendum
   * @returns {Promise<WriteResult>}
   */
  async function updateWhitelist (addendumSnapshot) {
    const newAddendum = addendumSnapshot.data()
    const agreementId = newAddendum.agreementId
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
          .concat([newAddendum])
          .reduce((whitelist, addendum) => {
            addendum.added.map(identityKey).forEach(val => {
              whitelist.add(val)
            })
            addendum.removed.map(identityKey).forEach(val => {
              whitelist.delete(val)
            })
            return whitelist
          }, new Set())
      })
      .then(whitelist => {
        // Store the whitelist using the same ID as the agreement.
        return db.collection('whitelists')
          .doc(agreementId)
          .set({
            lastUpdated: new Date(),
            values: Array.from(whitelist)
          })
      })
      .then(writeResult => {
        console.debug(`Successfully updated whitelist for agreement ${agreementId} `)
        return writeResult
      })
      .catch(error => {
        console.debug(`Error while updating whitelist for agreement ${agreementId}`, error)
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
   * Promises and object describing whether all given identities are
   * whitelisted, or not.
   * @param identities {{..., type: string, value: string}[]}
   * @returns {Promise<{allWhitelisted: boolean, missingIdentities: string[]}>}
   */
  async function checkIdentities (identities) {
    if (!Array.isArray(identities) || !identities.length) {
      console.warn('undefined or empty identities')
      return Promise.resolve({
        allWhitelisted: false,
        missingIdentities: []
      })
    }

    // Normalize to keys to simplify DB queries.
    const identityKeys = identities.map(identityKey)
    const allValidIdentities = identityKeys.reduce(
      (r, v) => r && Boolean(v), true)

    if (!allValidIdentities) {
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

  // unused
  // async function getPrsForEmail (email) {
  //   if (!email) {
  //     console.log('email is not provided')
  //     return false
  //   }
  //   const doc = await firestore.collection('failedPRs').doc(email).get()
  //   if (pr.exists) {
  //     console.log('PR toJson:', doc.toJson())
  //     return doc.toJson().refs
  //   }
  //   // doc.toJson() will be undefined in this case
  //   console.log('No outstanding PR')
  //   return []
  // }

  return {
    updateWhitelist: updateWhitelist,
    isIdentityWhitelisted: isIdentityWhitelisted,
    checkIdentities: checkIdentities
  }
}

//
// async function setup() {
//
/// /    var claRef = firestore.collection('clas');
/// /
/// /    Promise.all([
/// /        await firestore.collection('clas').add({
/// /          admins: ['bocon@opennetworking.org'],
/// /          whitelist: ['bocon@opennetworking.org'],
/// /          blacklist: [], // not in whitelist
/// /          domain: 'opennetworking.org' // must be one of the admin's domains
/// /        }).then(ref => {
/// /          console.log('Added document with ID: ', ref.id);
/// /        })
/// /    ])
// }
