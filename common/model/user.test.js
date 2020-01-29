import { User } from './user'

describe('The User model', () => {
  let model = null
  beforeEach(() => {
    model = new User('John', 'john@onf.dev', 'john-onf')
  })
  it('should correctly instantiate the class', () => {
    expect(model.name).toEqual('John')
    expect(model.email).toEqual('john@onf.dev')
    expect(model.githubId).toEqual('john-onf')
  })
})
