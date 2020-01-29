import { FirebaseApp } from '../app/app'

export default class DB {
  static connection () {
    return FirebaseApp.firestore()
  }
}
