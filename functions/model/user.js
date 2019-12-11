/**
 * User model class.
 */
class User {

    /**
     * Creates a new user.
     * @param {string} name full name of the user
     * @param {string} email email of the  user
     * @param {string|null} githubId Github user ID (optional)
     */
    constructor(name, email, githubId) {
        this._name = name;
        this._email = email;
        this._githubId = githubId;
    }

    /**
     * Returns the name.
     *
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Returns the email.
     *
     * @returns {string}
     */
    get email() {
        return this._email;
    }

    /**
     * Returns the Github user ID.
     * @returns {string}
     */
    get githubId() {
        return this._githubId;
    }
}

module.exports = User