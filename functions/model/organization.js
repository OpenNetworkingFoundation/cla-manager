/**
 * Organization model class.
 */
class Organization {

    /**
     * Creates a new organization.
     * @param {string} name the name of the organization
     * @param {string} department the organization department covered by the
     * agreement
     * @param {string[]} domains array of email domains owned by the
     * organization
     */
    constructor(name, department, domains) {
        this._name = name;
        this._department = department;
        this._domains = domains;
    }

    /**
     * Returns the name.
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Returns the department.
     * @returns {string}
     */
    get department() {
        return this._department;
    }

    /**
     * Returns the email domains.
     * @returns {string[]}
     */
    get domains() {
        return this._domains;
    }
}