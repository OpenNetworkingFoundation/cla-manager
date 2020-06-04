import { Firebase } from '../app/app'

export default class DB {
  static connection () {
    const db = Firebase.firestore()
    if (location.hostname === 'localhost') {
      // Talk to emulator (hostname comes from docker-compose.yml)
      db.settings({
        host: 'localhost:8080',
        ssl: false
      })
    }
    return db
  }
}
