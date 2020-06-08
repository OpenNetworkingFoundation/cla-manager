const CrowdWebhook = require('../lib/crowd_webhook')

const GithubApiMock = () => {
  const githubAdded = []
  const githubRemoved = []

  function mockGithubAdd (user, org, team) {
    githubAdded.push({ org, team, user })
  }

  function mockGithubRemove (user, org, team) {
    githubRemoved.push({ org, team, user })
  }

  return {
    added: githubAdded,
    removed: githubRemoved,
    addUser: mockGithubAdd,
    deleteUser: mockGithubRemove
  }
}

describe('Crowd Webhook lib', () => {
  let groupMappings
  let github
  let crowdWebhook

  beforeAll(() => {
    groupMappings = require('./crowd_events/test_config')
  })

  beforeEach(() => {
    github = GithubApiMock()
    crowdWebhook = CrowdWebhook(groupMappings, github)
  })

  test('user added', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_added'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([])
  })

  test('user added github', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_added_github'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([])
  })

  test('user added github with existing group', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_added_github_with_group'))
    expect(github.added).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github' },
      { org: 'github_org2', team: 'team2', user: 'tester_github' }
    ])
    expect(github.removed).toEqual([])
  })

  test('user added group', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_added_group'))
    expect(github.added).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github' },
      { org: 'github_org2', team: 'team2', user: 'tester_github' }
    ])
    expect(github.removed).toEqual([])
  })

  test('user deleted', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_deleted'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github' },
      { org: 'github_org2', team: 'team2', user: 'tester_github' },
      { org: 'github_org3', team: 'team3', user: 'tester_github' }
    ])
  })

  test('user deleted github', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_deleted_github'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github' },
      { org: 'github_org2', team: 'team2', user: 'tester_github' }
    ])
  })

  test('user deleted group', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_deleted_group'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([])
  })

  test('user deleted group with github', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_deleted_group_with_github'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github' },
      { org: 'github_org2', team: 'team2', user: 'tester_github' }
    ])
  })

  test('user updated email', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_updated_email'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([])
  })

  test('user updated github', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_updated_github'))
    expect(github.added).toEqual([])
    expect(github.removed).toEqual([])
  })

  test('user updated github with group', function () {
    crowdWebhook.processEvent(require('./crowd_events/user_updated_github_with_group'))

    expect(github.added).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github2' },
      { org: 'github_org2', team: 'team2', user: 'tester_github2' }
    ])
    expect(github.removed).toEqual([
      { org: 'github_org1', team: 'team1', user: 'tester_github' },
      { org: 'github_org2', team: 'team2', user: 'tester_github' }
    ])
  })
})
