import { Addendum, AddendumType } from './addendum'
const User = require("./user")

describe('The Addendum model', () => {
	let model, signer = null;
	beforeEach(() => {

		signer = new User()

		model = new Addendum(
			"ffgg",
			AddendumType.CONTRIBUTOR,
			"aabb",
			signer,
			[],
			[]
		);
	})
	it('should correctly instantiate the class', () => {
		expect(model.id).toEqual("ffgg");
		expect(model.type).toEqual("contributor");
		expect(model.agreementId).toEqual("aabb");
		expect(model.signer).toEqual(signer)
	})
})