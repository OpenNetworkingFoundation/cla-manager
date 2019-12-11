/**
 * Types of agreements.
 * @type {{CORPORATE: string, INDIVIDUAL: string}}
 */
const AgreementType = {
    /**
     * Individual CLA.
     */
    INDIVIDUAL: 'individual',
    /**
     * Corporate CLA.
     */
    CORPORATE: 'corporate',
};

/**
 * Agreement model class.
 */
class Agreement {

    /**
     * Creates a new agreement.
     * @param {string} id global identifier
     * @param {AgreementType} type type of agreement
     * @param {Organization|null} organization organization covered by the
     * agreement, if {@link type} is {@link AgreementType.CORPORATE}, otherwise
     * {@code null}
     * @param {string} body the agreement text body
     * @param {User} signer the signer of the agreement
     */
    constructor(id, type, organization, body, signer) {
        this._id = id;
        this._type = type;
        this._organization = organization;
        this._body = body;
        this._signer = signer;
    }

    /**
     * Returns the agreement ID.
     * @returns {string}
     */
    get id() {
        return this._id;
    }

    /**
     * Returns the agreement type.
     * @returns {AgreementType}
     */
    get type() {
        return this._type;
    }

    /**
     * Returns the organization.
     * @returns {Organization}
     */
    get organization() {
        return this._organization;
    }

    /**
     * Returns the body.
     * @returns {string}
     */
    get body() {
        return this._body;
    }

    /**
     * Returns the signer.
     * @returns {User}
     */
    get signer() {
        return this._signer;
    }
}