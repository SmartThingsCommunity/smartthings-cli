import { Flags } from '@oclif/core'
import { APICommand } from './api-command'


/**
 * Base class for commands that need to use Rest API commands via the
 * SmartThings Core SDK and can act on the behalf of different organizations.
 */
export abstract class APIOrganizationCommand<T extends typeof APIOrganizationCommand.flags> extends APICommand<T> {
	static flags = {
		...APICommand.flags,
		organization: Flags.string({
			char: 'O',
			description: 'The organization ID to use for this command',
		}),
	}
}
