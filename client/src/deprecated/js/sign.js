function signIndividualCla (event) {
  const email = firebase.auth().currentUser.email
  const name = document.getElementById('individual-name').value
  console.log('individual', name, email)

  if (!email || !name) {
    alert('invalid email or name')
    return
  }

  firebase.firestore().collection('clas').add({
    signer: email,
    signerDetails: { name, email },
    whitelist: [email],
    type: 'individual',
    dateSigned: new Date()
  }).then(ref => {
    console.log('Added document with ID: ', ref.id)
    window.location.href = '/'
  }).catch(function (error) {
    handleError(error)
  })
}

function signInstitutionalCla () {
  const email = firebase.auth().currentUser.email
  const name = document.getElementById('signer-name').value
  if (!email || !name) {
    alert('invalid email or name')
    return
  }

  const signerDetails = {
    name,
    email,
    title: document.getElementById('signer-title').value
  }
  const institution = {
    name: document.getElementById('institution-name').value,
    address: document.getElementById('institution-address').value
  }
  const adminDetails = [
    {
      name: document.getElementById('primary-name').value,
      email: document.getElementById('primary-email').value.toLowerCase(),
      phone: document.getElementById('primary-phone').value
    },
    {
      name: document.getElementById('secondary-name').value,
      email: document.getElementById('secondary-email').value.toLowerCase(),
      phone: document.getElementById('secondary-phone').value
    }
  ]

  const whitelist = document.getElementById('institutional-whitelist').value
    .toLowerCase()
    .split(/[\n,; ]+/)
  console.log('whitelist', whitelist)

  firebase.firestore().collection('clas').add({
    signer: signerDetails.email,
    signerDetails,
    institution,
    admins: adminDetails.map(a => a.email),
    adminDetails,
    whitelist,
    // blacklist FIXME
    // domain FIXME
    type: 'institutional',
    dateSigned: new Date()
  }).then(ref => {
    console.log('Added document with ID: ', ref.id)
    // window.location.href = "/";
  }).catch(function (error) {
    handleError(error)
  })
}

/**
 * Handles Errors from various Promises.
 */
function handleError (error) {
  // Display Error.
  alert('Error: ' + error.message)
  console.log(error)
}

/**
 * Show the correct CLA
 */
function showCla () {
  const claType = new URLSearchParams(window.location.search).get('kind')
  if (claType === 'institutional') {
    document.getElementById('individual-cla').hidden = true
    document.getElementById('institutional-cla').hidden = false
    document.getElementById('institutional-cla-accept').addEventListener('click', signInstitutionalCla, false)
  } else { // show the individual CLA
    document.getElementById('individual-cla').hidden = false
    document.getElementById('institutional-cla').hidden = true
    document.getElementById('individual-cla-accept').addEventListener('click', signIndividualCla, false)
  }
}

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp () {
  // Listening for auth state changes.
  firebase.auth().onAuthStateChanged(function (user) {
    console.log('statechange', user)
    if (user) {
      // User is signed in.
      var email = user.email
      document.getElementById('display-email').textContent = email
      document.getElementById('display-email2').textContent = email
    } else {
      // User is signed out.
      // TODO redirect
    }
  })
  showCla()
}

window.onload = initApp
