import firebase from 'firebase/app';

export default class ClaDb {

    constructor(db) {
        if (db) {
            this.db = db;
            console.log(db)
        } else {
            this.db = firebase.firestore();
        }
    }

    createIndividualCla(name, email) {
        this.db.collection('clas').add({
            signer: email,
            signerDetails: { name, email },
            whitelist: [ email ],
            type: "individual",
            dateSigned: new Date()
        }).then(ref => {
            console.log('Added document with ID: ', ref.id);
            // redirect to user homepage
            window.location.href = "/";
        }).catch(error => {
            console.log("Error saving CLA");
            console.log(error);
            this.setState({formEnabled: true});
        });    
    }

    createInstitutionalCla() {

    }

    getCla(key) {

    }

    lookupClas(email) {
            
    }

    // Returns unsubscribe function
    subscribeToClas(email, fn) {
        return this.db.collection('clas')
        .where('whitelist', 'array-contains', email)
        .onSnapshot(fn)
    }
}