import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import AdminIdentitiesList from './AdminIdentitiesList'
import { Whitelist } from '../../../../common/model/whitelists'
import MaterialTable from 'material-table'

Enzyme.configure({ adapter: new Adapter() })

const identites = [
  {
    identity: 'foo@opennetworking.org',
    type: 'email',
    agreements: ['123', '456']
  },
  { identity: 'baz', type: 'github', agreements: ['123'] }
]

describe('AdminIdentitiesList Component Test Suite', () => {
  let wrapper, useEffect, getWhitelistWithAgreementIdSpy

  const mockUseEffect = () => {
    useEffect.mockImplementationOnce(f => f())
  }

  beforeEach(() => {
    useEffect = jest.spyOn(React, 'useEffect')
    getWhitelistWithAgreementIdSpy = jest.spyOn(Whitelist, 'getWhitelistWithAgreementId')
      .mockImplementation(() => {
        return Promise.resolve(identites)
      })

    // NOTE in a real Ract-component use effect is called tree times
    // before reaching the real function(not sure why)
    mockUseEffect()
    mockUseEffect()
    mockUseEffect()
    wrapper = shallow(<AdminIdentitiesList/>)
  })

  it('renders without crashing', () => {
    expect(wrapper).toBeDefined()
    expect(getWhitelistWithAgreementIdSpy).toHaveBeenCalled()
    const tableProps = wrapper.find(MaterialTable).props()
    expect(tableProps.data).toEqual(identites)
  })
})
