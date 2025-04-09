import { type Invitation } from '../../edge/endpoints/invites.js'
import { type EdgeCommand } from '../edge-command.js'
import { buildListFunction } from './edge-invites-util.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


// We need access to the special temporary `edgeClient` in `EdgeCommand` to list invites for now.
// Since this is supposed to be temporary, I don't want to update `createChooseFn` for it.
export const chooseInviteFn = (
		command: EdgeCommand,
		options?: { channelId?: string },
): ChooseFunction<Invitation> => createChooseFn(
	{
		itemName: 'invitation',
		primaryKeyName: 'id',
		// only supports simple properties so we can't sort by metadata.name even though we can use that in the table
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id', { path: 'metadata.name' }],
	},
	buildListFunction(command, options?.channelId),
)

// There is no `chooseInvite` default here because the `EdgeCommand` is required.
// i.e. all users will have to call `chooseInviteFn` to get a `chooseInvite`.
