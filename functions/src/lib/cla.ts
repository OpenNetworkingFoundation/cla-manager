import {
  DocumentData,
  DocumentSnapshot,
  Firestore
} from "@google-cloud/firestore";
import {WriteResult} from "@google-cloud/firestore/build/src";

const util = require('./util')

module.exports = Cla

/**
 * Returns CLA-related functions.
 * @param db firestore instance
 * @constructor
 */
function Cla(db: Firestore) {
  /**
   * Given a snapshot of a newly created addendum, updates the whitelist in the
   * parent agreement by replying all addendums in chronological order. If
   * snapshot is null, the implementation updates the whitelist for the
   * given agreementId.
   * @param addendumSnapshot addendum snapshot
   * @param agreementId agreement ID (if snapshot is null)
   */
  async function updateWhitelist(addendumSnapshot: DocumentSnapshot,
                                 agreementId: string | null = null):
    Promise<WriteResult> {
    let newAddendum: any
    let idOfAgreement: string
    if (addendumSnapshot) {
      newAddendum = addendumSnapshot.data()
      idOfAgreement = newAddendum.agreementId
    } else if (agreementId === null) {
      throw new Error('Both addendumSnapshot and agreementId are null, which' +
        ' whitelist should I update?')
    } else {
      newAddendum = null
      idOfAgreement = agreementId
    }
    // @ts-ignore
    // @ts-ignore
    return db.collection('agreements').doc(idOfAgreement).get()
      .then(agreement => {
        if (!agreement.exists) {
          return Promise.reject(new Error('Agreement does not exist'))
        }
        return db.collection('addendums')
          .where('agreementId', '==', idOfAgreement)
          .orderBy('dateSigned')
          .get()
      })
      .then(addendumQuery => {
        return addendumQuery.docs.map(s => s.data())
          // When using the firestore emulator, query results don't always
          // include the latest writes, such as the new addendum. We manually
          // append it to the results to always pass the tests.
          .concat([newAddendum || {added: [], removed: []}])
          .reduce((whitelist: Set<string>, addendum: DocumentData) => {
            addendum.added.map(util.identityKey).forEach((val: string) => {
              whitelist.add(val)
            })
            addendum.removed.map(util.identityKey).forEach((val: string) => {
              whitelist.delete(val)
            })
            return whitelist
          }, new Set())
      })
      .then((whitelist: Set<string>) => {
        // Store the whitelist using the same ID as the agreement.
        return db.collection('whitelists')
          .doc(idOfAgreement)
          .set({
            lastUpdated: new Date(),
            values: Array.from(whitelist)
          })
      })
      .then(writeResult => {
        console.debug(`Successfully updated whitelist for agreement ${idOfAgreement} `)
        return writeResult
      })
      .catch(error => {
        console.debug(`Error while updating whitelist for agreement ${idOfAgreement}`, error)
        return Promise.reject(error)
      })
  }

  /**
   * Given an identity it returns a boolean promise indicating whether the
   * identity is whitelisted or not.
   * @param identity {{..., type: string, value: string}}
   */
  async function isIdentityWhitelisted(identity: Object): Promise<boolean> {
    return checkIdentities([identity]).then(r => r.allWhitelisted)
  }

  /**
   * Promises an object describing whether all given identities are
   * whitelisted, or not.
   * @param identities {{..., type: string, value: string}[]}
   */
  async function checkIdentities(identities: Object[]):
    Promise<{ allWhitelisted: boolean, missingIdentities: string[] }> {
    if (!Array.isArray(identities) || !identities.length) {
      console.warn('undefined or empty identities')
      return Promise.resolve({
        allWhitelisted: false,
        missingIdentities: [],
      })
    }

    let identityKeys: string[]
    try {
      identityKeys = identities.map(util.identityKey)
    } catch (e) {
      console.warn(e)
      return Promise.resolve({
        allWhitelisted: false,
        missingIdentities: []
      })
    }

    // Each unique identity gets its own query. We could use `array-contains-in`
    // and reduce the number of queries, but we need to manage its limitations:
    // https://firebase.google.com/docs/firestore/query-data/queries#query_limitations
    const uniqueIdentities = Array.from(new Set(identityKeys))
    const queries = uniqueIdentities.map((identityKey) => db
      .collection('whitelists')
      .where('values', 'array-contains', identityKey)
      .get().then(function (query) {
        return {
          identity: identityKey,
          whitelisted: !query.empty
        }
      }))

    return Promise.all(queries)
      .then(result => {
        const missing = result.reduce((m: string[], query) => {
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
