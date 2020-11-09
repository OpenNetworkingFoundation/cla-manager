module.exports = CrowdWebhook

function hasProperty (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property)
}

function CrowdWebhook (groupMappings, github) {
  async function processMembership (user, group, filter, add) {
    const noFilter = !Array.isArray(filter) || !filter.length
    const mappings = groupMappings[group]
    for (const i in mappings) {
      const mapping = mappings[i]
      if (hasProperty(mapping, 'githubOrg') && // handle Github membership
        (noFilter || filter.includes('github')) &&
        hasProperty(user, 'githubId')) {
        try {
          if (add) {
            console.log(`Adding ${user.githubId} to ${mapping.githubOrg}:${mapping.team}`)
            // TODO: save some API calls by not always calling this
            await github.createTeam(mapping.githubOrg, mapping.team)
            await github.addUser(user.githubId, mapping.githubOrg, mapping.team)
            // TODO: handle response?
          } else {
            console.log(`Removing ${user.githubId} from ${mapping.githubOrg}:${mapping.team}`)
            await github.deleteUser(user.githubId, mapping.githubOrg, mapping.team)
            // TODO: handle response?
          }
        } catch (e) {
          console.log(e)
        }
      } // else if gerrit mapping
      // TODO: implement this
    }
  }

  async function addMembership (user, group, filter) {
    await processMembership(user, group, filter, true)
  }

  async function removeMembership (user, group, filter) {
    await processMembership(user, group, filter, false)
  }

  async function processEvent (event) {
    if (event.type === 'USER_ADDED' || event.type === 'USER_ADDED_GITHUB') {
      const filter = (event.type === 'USER_ADDED_GITHUB') ? ['github'] : []
      if (event.user && event.user.groups) {
        for (const group of event.user.groups) {
          await addMembership(event.user, group, filter)
        }
      }
    } else if (event.type === 'USER_UPDATED_GITHUB') {
      if (event.user && event.user.groups) {
        if (event.oldGithubId === event.newGithubId) {
          console.log(`Received USER_UPDATED_GITHUB for ${event.user.username} ` +
                      `with same old and new Github IDs: ${event.user.githubId}. ` +
                      "Discarding event...");
          return;
        }
        for (const group of event.user.groups) {
          await removeMembership({ githubId: event.oldGithubId }, group, ['github'])
          await addMembership(event.user, group, ['github'])
        }
      }
    } else if (event.type === 'USER_DELETED_GITHUB') {
      if (event.user && event.user.groups) {
        for (const group of event.user.groups) {
          await removeMembership({ githubId: event.oldGithubId }, group, ['github'])
        }
      }
    } else if (event.type === 'USER_ADDED_GROUP') {
      await addMembership(event.user, event.groupName, [])
    } else if (event.type === 'USER_DELETED_GROUP') {
      await removeMembership(event.user, event.groupName, [])
    } else if (event.type === 'USER_DELETED') {
      for (const group in groupMappings) {
        // this approach is a bit brute force, and will attempt to remove user from all known groups
        await removeMembership({ githubId: event.oldGithubId, email: event.oldEmail }, group, [])
      }
    } else {
      // don't care about this event
    }
  }

  return {
    processEvent: processEvent
  }
}
