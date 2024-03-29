# cla-manager (CLAM) [![CircleCI](https://circleci.com/gh/OpenNetworkingFoundation/cla-manager/tree/master.svg?style=svg)](https://circleci.com/gh/OpenNetworkingFoundation/cla-manager/tree/master)

![CLAM logo](media/clam.png)

CLAM is a tool for managing Contributor License Agreements.

It integrates with Github and Gerrit code hosting platforms.

There are two supported types of CLAs:

- Individual CLAs, when signing as an individual developer who holds the
  copyright on their contributions

- Institutional CLAs, which allows a nontechnical manager in another
  organization to approve a CLA for multiple developers

Code submitters are identified by their email addresses or GitHub usernames.

If a user hasn't signed a CLA and submits code, they are directed to the CLAM
website to sign a CLA. Authentication is handled by single-use links sent out
via email.

## Requirements

CLAM's server side components are hosted on
[Firebase](https://firebase.google.com/).

A paid Firebase account must be used so it can make API calls to GitHub.

## Navigating the code

For the user-facing web app used to sign CLAs look in [./client](./client).

For the server functions used to handle GitHub and Gerrit API interactions,
look in [./functions](./functions).

For the common code look in [./common](./common).

For a [gerrit
hook](https://gerrit.googlesource.com/plugins/hooks/+/master/src/main/resources/Documentation/hooks.md)
to check licensing for gerrit, look in [./gerrit]. Unlike the rest of CLAM,
this is written in Python 3, and has no dependencies outside the standard
library.

## Testing and development

Automated tests are run prior to patchset acceptance using CircleCI - see the
[./.circleci/config.yml](./.circleci/config.yml) for details. The commands in
given in that file can be used to run tests locally on a developer machine.

If you don't have one, create an application on
[Firebase](https://console.firebase.google.com/).

Once you have it, you'll need to keep track of the `Project ID` and `Web API
Key` (You can find them in the `Settings` panel). You'll also need to set up
Email/Password authentication in the `Authentication` panel.

The whole site, including Firestore and Firebase functions can be run on a
developer machine using the [local firebase
emulator](https://firebase.google.com/docs/functions/local-emulator), which is
run through the firebase CLI tool. `npm` must also be installed to obtain
dependencies.

Prepare the system by creating a file that contains the configuration variables
in `functions/.runtimeconfig.json` with this dummy contents:

    {
      "gerrit": {
        "password": "password",
        "user": "username"
      },
      "backup": {
        "bucket_name": "invalid",
        "period": "every 24 hours"
      },
      "github": {
        "key": "invalid",
        "app_id": "invalid",
        "secret": "invalid"
      },
      "crowd": {
        "app_name": "invalid",
        "app_password": "invalid",
      }
    }

To run the emulators:
    
    cd ./functions
    npm install
    npx firebase --project <project-id> emulators:start --only firestore,functions

See the output for the endpoint address of the emulator UI (usually <http://127.0.0.1:4000/>)

To serve the client:

    cd ./client
    npm install
    REACT_APP_FIREBASE_ENV=<project-id> REACT_APP_FIREBASE_API_KEY=<web-api-key> npm start

See the output for the endpoint address (usually <http://localhost:3000/>).

## Data lifecycle

Backups happen to Google Cloud storage buckets.  These are generated on a
timer, and also prior to each deployment.

## Other CLA management tools to consider

[easycla](https://github.com/communitybridge/easycla), which is a Linux
Foundation's tool, but is closely tied to their identity/authentication
management platform and was (is?) undergoing a partial rewrite.  Much of the
workflow used in CLAM inspired by [this easycla process
diagram](https://github.com/communitybridge/easycla/tree/master/getting-started#how-does-it-work).

[cla-assistant](https://github.com/cla-assistant), which can be publicly used
without having to host an instance of the tool, but was insufficient for our
purposes because it only supports individual CLAs.

## License

Apache 2.0
