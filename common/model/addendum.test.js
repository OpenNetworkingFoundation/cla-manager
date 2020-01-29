import { Addendum, AddendumType } from './addendum'
import { User } from './user'

describe('The Addendum model', () => {
    let model, signer, contributor1, contributor2 = null;
    beforeEach(() => {

        signer = new User("John", "john@onf.dev", "john-onf");
        contributor1 = new User("Emma", "emma@onf.dev", "emma-onf");
        contributor2 = new User("Gigi", "gigi@onf.dev", "gigi-onf");

        model = new Addendum(
            "ffgg",
            AddendumType.CONTRIBUTOR,
            "aabb",
            signer,
            [contributor1],
            [contributor2]
        );
    });
    it('should correctly instantiate the class', () => {
        expect(model.id).toEqual("ffgg");
        expect(model.type).toEqual("contributor");
        expect(model.agreementId).toEqual("aabb");
        expect(model.signer).toEqual(signer);
        expect(model.added).toEqual([contributor1]);
        expect(model.removed).toEqual([contributor2]);
    })
});