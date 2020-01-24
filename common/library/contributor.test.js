const getActiveEmails = require('./contributor').getActiveEmails;
const Addendum = require('../model/addendum').Addendum;
const User = require("../model/user").User;

describe('The getActiveEmails function', () => {
    let john, emma, gigi, addendums, active = null;
    beforeEach(() => {
        john = new User("John", "john@onf.dev", "john-onf");
        emma = new User("Emma", "emma@onf.dev", "emma-onf");
        gigi = new User("Gigi", "gigi@onf.dev", "gigi-onf");

        addendums = [
            new Addendum(null, null, null, null, [john], []),
            new Addendum(null, null, null, null, [emma, gigi], []),
            new Addendum(null, null, null, null, [], [gigi]),
        ];

        active = getActiveEmails(addendums);
    });
    it('should return only the active email addresses', () => {
        expect(active).toContain(john.email);
        expect(active).toContain(emma.email);
        expect(active).not.toContain(gigi.email);
    });
    it('should have correct size', () => {
        expect(active.size).toEqual(2);
    })
});