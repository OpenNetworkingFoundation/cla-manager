# pip install firebase-admin
# python adminManager.py --cred clam.json --user foo@opennetworking.org
# python adminManager.py --cred clam.json --user foo@opennetworking.org --remove
import sys

import firebase_admin
from firebase_admin import credentials, auth
from firebase_admin._auth_utils import UserNotFoundError
import argparse

if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Manages and admin in your firebase app')
    parser.add_argument('--cred', dest='cred', required=True,
        help='The gcloud credentials file (from https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)')

    parser.add_argument('--user', dest='user', required=True,
                        help='The email address of the user you want to promote as admin')

    parser.add_argument('--remove', dest='remove', action='store_true',
                        help='If set removes admin roles from the user')

    args = parser.parse_args()

    cred = credentials.Certificate(args.cred)
    app = firebase_admin.initialize_app(cred)

    try:
        user = auth.get_user_by_email(args.user)
        print("User %s has UID %s" % (args.user, user.uid))
    except UserNotFoundError:
        print("User %s not found" % args.user)

    if args.remove:
        if user.custom_claims and user.custom_claims.get('admin') == False:
            print("User %s is already not admin" % args.user)
            sys.exit(0)
        else:
            # NOTE this may need to change if we start using other user_claim for different roles
            auth.set_custom_user_claims(user.uid, {'admin': False})
            print("User %s removed from admin role" % args.user)
    else:
        if user.custom_claims and user.custom_claims.get('admin') == True:
            print("User %s is already admin" % args.user)
            sys.exit(0)
        else:
            auth.set_custom_user_claims(user.uid, {'admin': True})
            print("User %s added to admin role" % args.user)