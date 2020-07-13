import { Firebase } from '../app/app'

export default class DB {
  static connection () {
    const db = Firebase.firestore()
    if (process.env.REACT_APP_FIREBASE_EMULATOR === 'true') {
      // Talk to emulator
      db.settings({
        host: 'localhost:8080',
        ssl: false
      })
    }
    return db
  }
}
