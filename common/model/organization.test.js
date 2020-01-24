const Organization = require("./organization").Organization;

describe('The Organization model', () => {
    let model = null;
    beforeEach(() => {
        model = new Organization("ONF", "engineering",
            ["onf.dev", "opennetworking.org"]);
    });
    it('should correctly instantiate the class', () => {
        expect(model.name).toEqual("ONF");
        expect(model.department).toEqual("engineering");
        expect(model.domains).toEqual(["onf.dev", "opennetworking.org"]);
    })
});