import { type EdgeClient, newEdgeClient } from '../edge/edge-client.js'
import { type APICommand } from './api-command.js'


// A temporary "command"-style function (similar to `apiCommand` and `smartThingsCommand`), that
// can wrap an `APICommand` or an `APIOrganizationCommand`, adding an `edgeClient` field which
// allows access to temporary edge invites endpoints.

export type EdgeCommand<T extends APICommand = APICommand> = T & { edgeClient: EdgeClient }
export const edgeCommand = <T extends APICommand> (parent: T): EdgeCommand<T> =>
	({ ...parent, edgeClient: newEdgeClient(parent) })
