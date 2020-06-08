module.exports = CrowdWebhook

function hasProperty (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property)
}

function CrowdWebhook (groupMappings, github) {
  if (!groupMappings) {
    // Use default mapping if one is not provided
    groupMappings = require('./crowd_webhook_config')
  }

  async function processMembership (user, group, filter, add) {
    const noFilter = !Array.isArray(filter) || !filter.length
    const mappings = groupMappings[group]
    for (const i in mappings) {
      const mapping = mappings[i]
      if (hasProperty(mapping, 'githubOrg') && // handle Github membership
              (noFilter || filter.includes('github')) &&
              hasProperty(user, 'githubId')) {
        if (add) {
          github.addUser(user.githubId, mapping.githubOrg, mapping.team)
          // TODO: handle response?
        } else {
          github.deleteUser(user.githubId, mapping.githubOrg, mapping.team)
          // TODO: handle response?
        }
      } // else if gerrit mapping
      // TODO: implement this
    }
  }

  async function addMembership (user, group, filter) {
    processMembership(user, group, filter, true)
  }

  async function removeMembership (user, group, filter) {
    processMembership(user, group, filter, false)
  }

  async function processEvent (event) {
    if (event.type === 'USER_ADDED' || event.type === 'USER_ADDED_GITHUB') {
      const filter = (event.type === 'USER_ADDED_GITHUB') ? ['github'] : []
      if (event.user && event.user.groups) {
        event.user.groups.forEach(group => {
          addMembership(event.user, group, filter)
        })
      }
    } else if (event.type === 'USER_UPDATED_GITHUB') {
      if (event.user && event.user.groups) {
        event.user.groups.forEach(group => {
          removeMembership({ githubId: event.oldGithubId }, group, ['github'])
          addMembership(event.user, group, ['github'])
        })
      }
    } else if (event.type === 'USER_DELETED_GITHUB') {
      if (event.user && event.user.groups) {
        event.user.groups.forEach(group => {
          removeMembership({ githubId: event.oldGithubId }, group, ['github'])
          addMembership(event.user, group, ['github'])
        })
      }
    } else if (event.type === 'USER_ADDED_GROUP') {
      addMembership(event.user, event.groupName, [])
    } else if (event.type === 'USER_DELETED_GROUP') {
      removeMembership(event.user, event.groupName, [])
    } else if (event.type === 'USER_DELETED') {
      for (const group in groupMappings) {
        // this approach is a bit brute force, and will attempt to remove user from all known groups
        removeMembership({ githubId: event.oldGithubId, email: event.oldEmail }, group, [])
      }
    } else {
      // don't care about this event
    }
  }

  return {
    processEvent: processEvent
  }
}
