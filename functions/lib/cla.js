import { IdentityType } from './common/model/identity'

module.exports = Cla

/**
 * Returns CLA-related functions.
 * @param db {FirebaseFirestore.Firestore}
 */
function Cla (db) {
  function getSet (whitelist, typ) {
    if (!Object.prototype.hasOwnProperty.call(whitelist, typ)) {
      whitelist[typ] = new Set()
    }
    return whitelist[typ]
  }

  function toJson (whitelist) {
    return Object.keys(whitelist).reduce((d, k) => {
      if (whitelist[k] instanceof Set) {
        d[k] = Array.from(whitelist[k])
      }
      return d
    }, {})
  }

  function normalize (identity) {
    if (!identity) {
      return false
    }
    if (!Object.prototype.hasOwnProperty.call(identity, 'type') ||
      !Object.prototype.hasOwnProperty.call(identity, 'value')) {
      console.warn('Identity objects must have at least a type, and a value')
      return false
    }
    const newIdentity = { ...identity }
    if (identity.type === IdentityType.EMAIL) {
      newIdentity.value = newIdentity.value.toLowerCase()
    }
    return newIdentity
  }

  /**
   * Given a snapshot of a newly created addendum, updates the whitelist in the
   * parent agreement by replying all addendums in chronological order.
   * @param {DocumentSnapshot} snapshot of a new addendum
   * @returns {Promise}
   */
  async function updateWhitelist (snapshot) {
    const newAddendumDoc = snapshot.data()
    const agreementId = newAddendumDoc.agreementId
    return db.collection('agreements').doc(agreementId).get()
      .then(agreement => {
        if (!agreement.exists) {
          return Promise.reject(new Error('Agreement does not exist'))
        }
        return db.collection('addendums')
          .where('agreementId', '==', agreementId)
          .orderBy('dateSigned')
          .get().then(function (query) {
            const whitelist = {
              agreementId: agreementId,
              lastUpdated: new Date()
            }
            query.docs.map(s => s.data())
              // When using the firestore emulator, query results don't always
              // include the latest writes, such as the new addendum. We manually
              // append it to the results to always pass the tests.
              .concat([newAddendumDoc])
              .forEach(function (addendum) {
                addendum.added.map(normalize).forEach(identity => {
                  getSet(whitelist, identity.type).add(identity.value)
                })
                addendum.removed.map(normalize).forEach(identity => {
                  getSet(whitelist, identity.type).delete(identity.value)
                })
              })
            // Store the whitelist using the same ID as the agreement.
            return db.collection('whitelists')
              .doc(agreementId)
              .set(toJson(whitelist))
          })
      })
      .then(function () {
        console.debug('Whitelist updated!', agreementId)
      })
  }

  /**
   * Given an identity it returns a boolean promise indicating whether the
   * identity is whitelisted, or not.
   * @param identity {Object}
   * @returns {Promise<boolean>}
   */
  async function isIdentityWhitelisted (identity) {
    identity = normalize(identity)

    if (!identity) {
      console.log('identity was not provided')
      return false
    }

    return db.collection('whitelists')
      .where(identity.type.toString(), 'array-contains', identity.value)
      .get().then(query => {
        // If not empty, we found at least one whitelist entry with the given
        // identity.
        return !query.empty
      })
      .catch(error => {
        console.log(error)
        return false
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
    isIdentityWhitelisted: isIdentityWhitelisted
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
