import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

export const FirebaseAppInit = function(apiKey, projectName, ){
	firebase.initializeApp({
		"apiKey": apiKey,
		"databaseURL": `https://${projectName}.firebaseio.com`,
		"storageBucket": `${projectName}.appspot.com`,
		"authDomain": `${projectName}.firebaseapp.com`,
		"messagingSenderId": "232849741230",
		"projectId": `${projectName}`,
	});
};

export const FirebaseApp = firebase