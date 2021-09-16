import { flags } from '@oclif/command'
import { APICommand } from './api-command'


/**
 * Base class for commands that need to use Rest API commands via the
 * SmartThings Core SDK and can act on the behalf of different organizations.
 */
export abstract class APIOrganizationCommand extends APICommand {
	static flags = {
		...APICommand.flags,
		organization: flags.string({
			char: 'O',
			description: 'The organization ID to use for this command',
		}),
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)
	}
}
