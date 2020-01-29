const App = require('@octokit/app')
const Octokit = require('@octokit/rest')
const WebhooksApi = require('@octokit/webhooks')

// const debug = false
// const reqLogger = {
//  debug: debug ? () => {} : console.log,
//  info: debug ? () => {} : console.log,
//  warn: console.warn,
//  error: console.error
// }

module.exports = Github

function Github (options) {
  options = options || {}
  //  const log = Object.assign({
  //    'debug': () => {},
  //    'info': () => {},
  //    'warn': console.warn,
  //    'error': console.error
  //  }, options && options.log)
  const id = options.id
  const privateKey = options.cert
  const secret = options.secret
  const claClient = options.cla
  //  if (!appId) throw 'app id is not defined in options'
  //  if (!privateKey) throw 'cert is not defined in options'

  const app = new App({ id, privateKey })
  // const jwt = app.getSignedJsonWebToken() // global app token
  const webhooks = new WebhooksApi(secret ? { secret } : {})

  webhooks.on('*', ({ id, name, payload }) => {
    console.log(name, 'event received')
  })

  webhooks.on('error', (error) => {
    console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`)
  })

  webhooks.on(['pull_request.opened', 'pull_request.synchronize'], async context => {
    const pr = context.payload.pull_request

    const owner = pr.base.repo.owner.login
    const repo = pr.base.repo.name
    const prNum = pr.number
    const eventType = context.payload.action
    const numCommits = pr.commits

    console.log(`Pull Request: ${owner}/${repo}/${prNum}, type ${eventType}, ${numCommits} commits`)

    /* TODO
         if numCommits <= 250, use the commits_url or pull request list commits API
         else, use the repo commits API; can be an error for now
       */
    if (numCommits > 250) {
      throw new Error('number of commits exceeds the 250 commit limit')
    }

    const installationId = context.payload.installation.id
    const installationAccessToken = await app.getInstallationAccessToken({ installationId })

    const client = new Octokit({
      auth: installationAccessToken // jwt,
      // log: reqLogger //FIXME
    })

    const responses = client.paginate.iterator(`GET ${pr.commits_url}`)
    let allSigned
    for await (const response of responses) {
      const commits = response.data
      allSigned = await commits
        .map(async commit => isClaSigned(commit))
        .reduce((r, v) => r = r && v, true)
        // TODO for debugging
      //        commits.forEach(async commit => {
      //            const signed = await isClaSigned(commit)
      //            console.log(`sha: ${commit.sha},
      //                author: ${commit.commit.author.name}/${commit.commit.author.email}/${commit.author.login},
      //                committer: ${commit.commit.committer.name}/${commit.commit.committer.email}/${commit.committer.login}
      //                signed: ${signed}`)
      //        })
        // TODO end debugging
      if (!allSigned) break // no need to continue; we found an unsigned commit
    }

    const status = {
      owner: owner,
      repo: repo,
      context: 'cla-manager',
      sha: pr.head.sha
    }
    if (allSigned) {
      console.log('cla is signed for all commits')
      status.state = 'success'
      status.description = 'CLA is signed'
    } else {
      console.log('cla is not signed for all commits')
      status.state = 'failure'
      status.target_url = 'https://sign.the.cla'
      status.description = 'CLA is not signed'
    }
    return client.repos.createStatus(status)
  })

  async function isClaSigned (commit) {
    // FIXME this is a hack for storing PR data
    const match = commit.url.match(/repos\/([^/]+)\/([^/]+)/)
    const ref = {
      owner: match[1],
      repo: match[2],
      sha: commit.sha
    }
    console.log(ref)

    const author = {
      email: commit.commit.author.email,
      githubId: commit.author.login
    }

    let committer
    if (commit.committer.login === 'web-flow') {
      // the commit was performed via the Github UI by the author
      committer = author
    } else {
      committer = {
        email: commit.commit.committer.email,
        githubId: commit.committer.login
      }
    }

    let signed = await claClient.isClaSigned(author, ref)
    if (!signed || author === committer) {
      return signed
    }

    // Make sure the committer has also signed a CLA if different than the author
    if (author.email !== committer.email || author.githubId !== committer.githubId) {
      signed = signed && await claClient.isClaSigned(committer, ref)
    }

    return signed
  }

  function recheckPrsForEmails (emails) {
    console.log('rechecking:', emails)
    return Promise.all(emails.map(async email => {
      const refs = await claClient.getPrsForEmail(email)
      return refs.map(ref => {
        // FIXME This is a Hack that won't work if there is more than one commit
        return client.repos.createStatus({
          owner: ref.owner,
          repo: ref.repo,
          sha: ref.sha,
          context: 'cla-manager',
          state: 'success',
          description: 'CLA is signed'
        })
      })
    }))
  }

  return {
    receive: webhooks.receive,
    handler: webhooks.middleware,
    recheckPrsForEmails
  }
}
