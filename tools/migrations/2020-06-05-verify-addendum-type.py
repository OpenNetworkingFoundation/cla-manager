# The migration name format is YYYY-MM-DD-migration-name
# All migrations must be idempotent, meaning that if you run them multiple times it's not an issue

# This migration will make sure that all Addendums stored without a Type are assigned the contributor type

import firebase_admin
from firebase_admin import credentials, firestore
import argparse

CONTRIBUTOR = u"contributor"
MANAGER = u"manager"

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Manages and admin in your firebase app')
    parser.add_argument('--cred', dest='cred', required=True,
                        help='The gcloud credentials file (from https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)')

    args = parser.parse_args()

    cred = credentials.Certificate(args.cred)

    app = firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://%s.firebaseio.com' % cred.project_id
    })

    db = firestore.client()

    addendums = db.collection('addendums').stream()

    for addendum in addendums:
        a = addendum.to_dict()
        if "type" in a and a["type"] in [CONTRIBUTOR, MANAGER]:
            # this addendum already has a type, do nothing
            print("Addendum %s has a type, doing nothing" %addendum.id)
            pass
        else:
            print("Addendum %s is missing type, defaulting to %s" % (addendum.id, CONTRIBUTOR))
            model = db.collection('addendums').document(addendum.id)
            model.update({'type': CONTRIBUTOR})

