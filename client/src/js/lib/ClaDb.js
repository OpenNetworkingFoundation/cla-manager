// deprecated, use common/db/db.js

import {FirebaseApp} from '../../common/app/app';

export default class ClaDb {

    constructor(db) {
        if (db) {
            this.db = db;
            console.log(db)
        } else {
            this.db = FirebaseApp.firestore();
        }
    }

    createIndividualCla(name, email) {
        let cla = {
            signer: email,
            signerDetails: { name, email },
            whitelist: [ email ],
            type: "individual",
            dateSigned: new Date()
        };
        this.createCla(cla);   
    }

    createInstitutionalCla(name, email) {
        let cla = {
            signer: email,
            signerDetails: { name, email },
            whitelist: [ email ],
            type: "institutional",
            dateSigned: new Date()
        };  
        this.createCla(cla);
    }

    createCla(cla) {
        this.db.collection('clas').add(cla).then(ref => {
            console.log('Added document with ID: ', ref.id);
            // redirect to user homepage
            window.location.href = "/";
        }).catch(error => {
            console.log("Error saving CLA");
            console.log(error);
            // FIXME redirect to an error page
            // this.setState({formEnabled: true});
        });
    }

    getCla(key) {

    }

    lookupClas(email) {
            
    }

    // Returns unsubscribe function
    subscribeToClas(email, fn) {
        return this.db.collection('agreements')
        .where('whitelist', 'array-contains', email)
        .onSnapshot(fn)
    }
}