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
                addendum.added.forEach(identity => {
                  getSet(whitelist, identity.type).add(identity.value)
                })
                addendum.removed.forEach(identity => {
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

  async function isClaSigned (user, ref) {
    if (!user || !user.email) {
      console.log('email is not provided')
      return false
    }

    const email = user.email.toLowerCase()

    try {
      const claRef = db.collection('clas')
      const clasByEmail = claRef.where('whitelist', 'array-contains', email)
      let snapshot = await clasByEmail.get()

      // Check if there is any CLA that signed for this email
      let signed = !snapshot.empty

      // TODO just for debugging
      //  snapshot.forEach(doc => {
      //      console.log(doc.id, ' => ', doc.toJson().whitelist);
      //  })

      // If there is no CLA signed by email, then check by domain
      if (!signed) {
        const domain = email.substring(email.lastIndexOf('@') + 1)
        const clasByDomain = claRef.where('domain', '==', domain)
        snapshot = await clasByDomain.get()

        // TODO just for debugging
        //                snapshot.forEach(doc => {
        //                    console.log(doc.id, ' => ', doc.toJson().domain , ' - ', doc.toJson().blacklist);
        //                })

        // Check that the email is not in the blacklist
        signed = !snapshot.empty && snapshot.docs
          .map(cla => cla.data().blacklist)
          .filter(blacklist => blacklist.indexOf(email) === -1)
          .length > 0
      }

      if (!signed && ref) {
        // store the PR for later :)
        var prRef = db.collection('failedPRs').doc(email)

        // Uncomment to initialize the doc.
        // sfDocRef.set({ population: 0 });

        await db.runTransaction(transaction => {
          // This code may get re-run multiple times if there are conflicts.
          return transaction.get(prRef).then(doc => {
            if (!doc.exists) {
              return transaction.set(prRef, { refs: [ref] })
            }
            const newRefs = doc.data().refs.push(ref)
            return transaction.update(prRef, { refs: newRefs })
          })
        }).then(() => {
          console.log('Transaction successfully committed!')
        }).catch(error => {
          console.log('Transaction failed: ', error)
          throw error
        })
      }

      return signed
    } catch (err) {
      console.log('Error getting CLAs', err)
      throw err
    }
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
    isClaSigned: isClaSigned
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
