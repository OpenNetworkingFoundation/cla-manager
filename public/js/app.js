/**
 * Handles the sign in button press.
 */
function signIn() {
    // Disable the sign-in button during async sign-in tasks.
    document.getElementById('sign-in').disabled = true;
    var email = document.getElementById('email').value;

    // Sending email with sign-in link.
    var actionCodeSettings = {
      'url': window.location.href,
      'handleCodeInApp': true
     };
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings).then(function() {
      // Save the email locally so you don’t need to ask the user for it again if they open
      // the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
      // The link was successfully sent. Inform the user.
      alert('An email was sent to ' + email + '. Please use the link in the email to sign-in.');
      // Re-enable the sign-in button.
      document.getElementById('sign-in').disabled = false;
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      handleError(error);
    });
}

/**
 * Handles automatically signing-in the app if we clicked on the sign-in link in the email.
 */
function handleSignInLink() {
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    // Disable the sign-in button during async sign-in tasks.
    document.getElementById('sign-in').disabled = true;

    // You can also get the other parameters passed in the query string such as state=STATE.
    // Get the email if available.
    var email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      // User opened the link on a different device. To prevent session fixation attacks, ask the
      // user to provide the associated email again. For example:
      email = window.prompt('Please provide the email you\'d like to sign-in with for confirmation.');
    }
    if (email) {
      // The client SDK will parse the code from the link for you.
      firebase.auth().signInWithEmailLink(email, window.location.href).then(function(result) {

        // Clear the URL to remove the sign-in link parameters.
        if (history && history.replaceState) {
          window.history.replaceState({}, document.title, window.location.href.split('?')[0]);
        }
        // Clear email from storage.
        window.localStorage.removeItem('emailForSignIn');
        // Signed-in user's information.
        var user = result.user;
        var isNewUser = result.additionalUserInfo.isNewUser;
        console.log(result)
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        handleError(error);
      });
    }

  }
}


/**
 * Handles the sign out button press.
 */
function signOut() {
    firebase.auth().signOut().catch(function(error) {
      handleError(error);
    });
}

/**
 * Handles Errors from various Promises.
 */
function handleError(error) {
  // Display Error.
  alert('Error: ' + error.message);
  console.log(error);
  // Re-enable the sign-in button.
  document.getElementById('sign-in').disabled = false;
}


function loadClas(email) {
  if (!email) {
    renderClaTables(null);
    return;
  }

  firebase.firestore().collection('clas')
    .where('whitelist', 'array-contains', email)
    .onSnapshot(renderClaTables);
}

/**
 * Clears all CLAs from the tables.
 */
function clearClaTables() {
    const individualTable = document.getElementById('individual-agreements')
    while (individualTable.rows.length > 1) {
        individualTable.deleteRow(1);
    }
    const institutionalTable = document.getElementById('institutional-agreements')
    while (institutionalTable.rows.length > 1) {
        institutionalTable.deleteRow(1);
    }
}

/**
 * Renders the CLAs in the appropriate tables.
 */
function renderClaTables(snapshot) {
    clearClaTables();

    let individualCount = 0
    let institutionalCount = 0

    if (snapshot || snapshot.size) {
        const options = { year: 'numeric', month: 'short', day: 'numeric',
                          hour: 'numeric', minute: 'numeric', hour12: false, timeZoneName: 'short' };
        const individualTable = document.getElementById('individual-agreements').getElementsByTagName('tbody')[0]
        const institutionalTable = document.getElementById('institutional-agreements').getElementsByTagName('tbody')[0]
        snapshot.forEach(cla => {
            let row
            console.log(cla.data())
            const type = cla.data().type || 'individual'
            const date = cla.data().dateSigned.toDate() || new Date()
            let name = cla.data().signer
            if (type === 'individual') {
                row = individualTable.insertRow(individualTable.rows.length);
                if (cla.data().signerDetails && cla.data().signerDetails.name) {
                    name = cla.data().signerDetails.name
                }
                individualCount++;
            } else if (type === 'institutional') {
                row = institutionalTable.insertRow(institutionalTable.rows.length);
                name = 'foo'
                institutionalCount++;
            } else {
                console.log('unknown cla type: ', cla.data())
                return
            }
            const cells = [
                name,
                date.toLocaleDateString('default', options),
                "link " + cla.id
            ];
            // Add cells to row
            for (let i in cells) {
                let c = row.insertCell(i)
                c.innerHTML = cells[i]
                c.classList.add("mdl-data-table__cell--non-numeric")
            }
        });
    }

    // Show or hide tables based on whether or not there are CLAs
    document.getElementById('individual-agreements-container').hidden = individualCount == 0
    document.getElementById('institutional-agreements-container').hidden = institutionalCount == 0
}

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
  // Automatically signs the user-in using the link.
  handleSignInLink();

  // Listening for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    console.log("statechange", user)
    if (user) {
      // User is signed in.
      var email = user.email;
      document.getElementById('sign-in-container').hidden = true;
      document.getElementById('sign-out-container').hidden = false;
      document.getElementById('new-agreement-container').hidden = false;
      document.getElementById('display-email').textContent = email;
      loadClas(email);
    } else {
      // User is signed out.
      document.getElementById('sign-in-container').hidden = false;
      document.getElementById('sign-out-container').hidden = true;
      document.getElementById('new-agreement-container').hidden = true;
      document.getElementById('display-email').textContent = 'UNKNOWN';
      clearClas()
    }
  });

  document.getElementById('sign-in').addEventListener('click', signIn, false);
  document.getElementById('sign-out').addEventListener('click', signOut, false);
}

window.onload = initApp;