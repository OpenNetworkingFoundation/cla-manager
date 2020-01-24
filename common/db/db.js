
import firebase from 'firebase/app';

export default class DB {
	static connection() {
		return firebase.firestore()
	}
}