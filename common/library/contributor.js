const Addendum = require('../model/addendum').Addendum;
const User = require('../model/user').User;

/**
 * Returns the set of active contributor email addresses, extracted from the
 * given list of addendums, assumed to be sorted by creation date in ascending
 * order.
 * @param {Addendum[]} addendums
 * @returns {Set<User>}
 */
function getActiveEmails(addendums) {

    let active = new Set();

    addendums.forEach(addendum => {
        addendum.added.forEach(u => active.add(u.email));
        addendum.removed.forEach(u => active.delete(u.email));
    });

    return active;
}

exports.getActiveEmails = getActiveEmails;