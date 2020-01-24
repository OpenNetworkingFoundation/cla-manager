import DB from '../db/db'
jest.mock('../db/db', () => jest.fn())

const mockAdd = jest.fn(() => {
	return Promise.resolve({id: "test-id"})
})

const mockCollection = jest.fn(() => {
	return {
		add: mockAdd
	}
})

const mockConnection = jest.fn(() => {
	return {
		collection: mockCollection
	}
})

DB.connection = mockConnection

import { Agreement, AgreementType } from './agreement'
const User = require("./user")

describe('The Agreement model', () => {
	let model, signer = null;

	beforeEach(() => {

		DB.mockClear();

		signer = new User()

		model = new Agreement(
			AgreementType.INDIVIDUAL,
			"TODO, add agreement body",
			signer
		);
	})
	it('should correctly instantiate the class for INDIVIDUAL', () => {
		expect(model.id).toEqual(null);
		expect(model.type).toEqual(AgreementType.INDIVIDUAL);
		expect(model.signer.email).toEqual(signer.email);
		expect(model.signer.name).toEqual(signer.name);
		expect(model._organization).toEqual(null)
	})

	it('should save a model to the database', () => {
		model.save()
		expect(DB.connection).toHaveBeenCalledTimes(1)
		expect(mockCollection).toBeCalledWith("agreements")
		expect(mockAdd).toBeCalledWith({
            signer: model.signer,
            type: model.type,
            dateSigned: model.dateSigned
		})
	})
})