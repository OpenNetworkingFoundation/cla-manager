const firebase = require('@firebase/testing')

/**
 * Returns a firestore instance that can be accessed as the user defined in the given auth object, optionally
 * pre-populated with the given data.
 * @param {{ uid: String, email: String }} auth identifiers
 * @param data {Object|null}
 * @param projectId {string|null}
 * @returns {Promise<FirebaseFirestore.Firestore>}
 */
module.exports.setupDb = async (auth, data, projectId = null) => {
  if (!projectId) {
    projectId = `test-${Date.now()}`
  }
  let app
  if (auth) {
    app = await firebase.initializeTestApp({
      projectId,
      auth
    })
  } else {
    app = await firebase.initializeAdminApp({
      projectId
    })
  }

  // firebase.firestore.setLogLevel('debug')
  const db = app.firestore()

  // Write mock documents before rules
  if (data) {
    for (const collectionKey in data) {
      const collectionRef = db.collection(collectionKey)
      for (const docKey in data[collectionKey]) {
        await collectionRef.doc(docKey).set(data[collectionKey][docKey])
      }
    }
  }

  // Apply rules
  // await firebase.loadFirestoreRules({
  //   projectId,
  //   rules: fs.readFileSync('../../../firestore.rules', 'utf8')
  // })

  return db
}

/**
 * Returns a firestore instance that can be accessed as admin, optionally populated with the given data object.
 * @param {Object|null} data
 *  * @param projectId {string|null}
 * @returns {Promise<FirebaseFirestore.Firestore>}
 */
module.exports.setupDbAdmin = async (data, projectId = null) => {
  return module.exports.setupDb(null, data)
}

/**
 * Clears all data associated with a particular project in the locally running
 * Firestore instance. Use this method to clean-up after tests.
 * @param projectId {string}
 * @returns {Promise<void>}
 */
module.exports.clearDb = async (projectId) => {
  return firebase.clearFirestoreData({
    projectId: projectId
  })
}

module.exports.teardownDb = async () => {
  await Promise.all(firebase.apps().map(app => app.delete()))
}

module.exports.addAndGetSnapshot = async (collectionRef, document) => {
  return collectionRef.add(document).then(res => res.get())
}

expect.extend({
  async toAllow (x) {
    let pass = false
    try {
      await firebase.assertSucceeds(x)
      pass = true
    } catch (err) {}

    return {
      pass,
      message: () => 'Expected Firebase operation to be allowed, but it was denied'
    }
  }
})

expect.extend({
  async toDeny (x) {
    let pass = false
    try {
      await firebase.assertFails(x)
      pass = true
    } catch (err) {}
    return {
      pass,
      message: () =>
        'Expected Firebase operation to be denied, but it was allowed'
    }
  }
})
