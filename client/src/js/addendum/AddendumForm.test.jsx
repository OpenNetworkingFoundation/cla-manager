import { AddendumFormCtrl } from './AddendumForm'
import { Agreement, AgreementType } from '../../common/model/agreement'
import { Identity, IdentityType } from '../../common/model/identity'
import { Whitelist } from '../../common/model/whitelists'

describe('AddendumFormCtrl Test Suite', () => {
  const signer = new Identity(
    IdentityType.EMAIL,
    'user',
    'test@onf.org'
  )
  const agreement = new Agreement(
    AgreementType.INDIVIDUAL,
    'foo',
    signer,
    null,
    null,
    new Date()
  )

  const whitelist = new Whitelist(
    1,
    new Date(),
    [],
    ['manager@onf.org']
  )

  describe('isOnwerOrManager method', () => {

    let getWhitelistMock

    beforeEach(() => {
      getWhitelistMock = jest.spyOn(Whitelist, 'get').mockImplementation(() => {
        return Promise.resolve({ data: () => whitelist })
      })
    })

    it('should return true if the user is owner', async () => {
      const success = await AddendumFormCtrl.isSignerOrManager({ email: signer.value }, agreement)
      expect(success).toBeTruthy()

      const failure = await AddendumFormCtrl.isSignerOrManager({ email: 'invalid@onf.org' }, agreement)
      expect(failure).toBeFalsy()
    })

    it('should return true if the user is a manager', async () => {
      const success = await AddendumFormCtrl.isSignerOrManager({ email: 'manager@onf.org' }, agreement)
      expect(success).toBeTruthy()
    })
  })
})
