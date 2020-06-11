const functions = require('firebase-functions')
const firestore = require('@google-cloud/firestore')
const client = new firestore.v1.FirestoreAdminClient()

module.exports = Backup

/**
 * Firestore backup related functions
 * @param bucket_name
 */
function Backup (bucketName) {
  return functions.pubsub.schedule('every 24 hours').onRun((context) => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT
    const databaseName = client.databasePath(projectId, '(default)')
    const bucket = 'gs://' + bucketName

    return client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucket,
      collectionIds: [
        'whitelists',
        'agreements',
        'addendums'
      ]
    })
      .then(responses => {
        const response = responses[0]
        console.log(`Operation Name: ${response.name}`)
        return response
      })
      .catch(err => {
        console.error(err)
        throw new Error('Export operation failed')
      })
  })
}
