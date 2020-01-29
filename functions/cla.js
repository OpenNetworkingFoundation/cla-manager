const admin = require('firebase-admin')
const functions = require('firebase-functions')

module.exports = Cla

function Cla () {
  admin.initializeApp(functions.config().firebase)
  const db = admin.firestore()

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
      //      console.log(doc.id, ' => ', doc.data().whitelist);
      //  })

      // If there is no CLA signed by email, then check by domain
      if (!signed) {
        const domain = email.substring(email.lastIndexOf('@') + 1)
        const clasByDomain = claRef.where('domain', '==', domain)
        snapshot = await clasByDomain.get()

        // TODO just for debugging
        //                snapshot.forEach(doc => {
        //                    console.log(doc.id, ' => ', doc.data().domain , ' - ', doc.data().blacklist);
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
            return transaction.update(sfDocRef, { refs: newRefs })
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
  //   const doc = await db.collection('failedPRs').doc(email).get()
  //   if (pr.exists) {
  //     console.log('PR data:', doc.data())
  //     return doc.data().refs
  //   }
  //   // doc.data() will be undefined in this case
  //   console.log('No outstanding PR')
  //   return []
  // }

  return { isClaSigned }
}

//
// async function setup() {
//
/// /    var claRef = db.collection('clas');
/// /
/// /    Promise.all([
/// /        await db.collection('clas').add({
/// /          admins: ['bocon@opennetworking.org'],
/// /          whitelist: ['bocon@opennetworking.org'],
/// /          blacklist: [], // not in whitelist
/// /          domain: 'opennetworking.org' // must be one of the admin's domains
/// /        }).then(ref => {
/// /          console.log('Added document with ID: ', ref.id);
/// /        })
/// /    ])
// }
