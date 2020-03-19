const firebase = require('@firebase/testing')

/**
 * Returns a firebase app and corresponding firestore instance that can be
 * accessed as the user defined in the given auth object, optionally
 * pre-populated with the given data.
 * @param auth
 * @param data
 * @param projectId
 * @returns {Promise<{app: firebase.app.App, db: FirebaseFirestore.Firestore}>}
 */
module.exports.setupEmulator = async (auth, data, projectId = null) => {
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

  return {
    app: app,
    db: db
  }
}

/**
 * Returns a firebase app and corresponding instance that can be accessed as
 * admin, optionally populated with the given data object.
 * @param {Object|null} data
 * @param projectId {string|null}
 * @returns {Promise<{app: firebase.app.App, db: FirebaseFirestore.Firestore}>}
 */
module.exports.setupEmulatorAdmin = async (data, projectId = null) => {
  return module.exports.setupEmulator(null, data, projectId)
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

module.exports.addAndGetSnapshot = async (collectionRef, document) => {
  return collectionRef.add(document).then(res => res.get())
}

module.exports.setAndGetSnapshot = async (collectionRef, document, id) => {
  return collectionRef.doc(id).set(document).then(() => collectionRef.doc(id).get())
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
