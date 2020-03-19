# pip install firebase-admin
# python addAdmin.py --cred /Users/teone/gcloud/calm-teo.json --user teo.punto@gmail.com
import sys

import firebase_admin
from firebase_admin import credentials, auth
from firebase_admin._auth_utils import UserNotFoundError
import argparse

if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Creates and admin in your firebase app')
    parser.add_argument('--cred', dest='cred', required=True,
        help='The gcloud credentials file (from https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)')

    parser.add_argument('--user', dest='user', required=True,
                        help='The email address of the user you want to promote as admin')

    args = parser.parse_args()

    cred = credentials.Certificate(args.cred)
    app = firebase_admin.initialize_app(cred)

    try:
        user = auth.get_user_by_email(args.user)
        print("User %s has UID %s" % (args.user, user.uid))
    except UserNotFoundError:
        print("User %s not found" % args.user)
        sys.exit(1)

    if user.custom_claims and user.custom_claims.get('admin') == True:
        print("User %s is already admin" % args.user)
        sys.exit(0)
    else:
        auth.set_custom_user_claims(user.uid, {'admin': True})