import { type APICommand } from '../command/api-command.js'
import { invitesEndpoint, type InvitesEndpoint } from './endpoints/invites.js'


// A temporary pseudo-client (similar to SmartThingsClient) for accessing the temporary `invites`
// endpoints while we wait for the real ones.

export type EdgeClient = {
	invites: InvitesEndpoint
}
export const newEdgeClient = (command: APICommand): EdgeClient => ({ invites: invitesEndpoint(command.client.config) })
