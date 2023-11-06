import { Argv } from 'yargs'

import { HttpClientHeaders } from '@smartthings/core-sdk'

import { APICommand, APICommandFlags, apiCommand, apiCommandBuilder } from './api-command.js'
import { SmartThingsCommand } from './smartthings-command.js'


export type APIOrganizationCommandFlags = APICommandFlags & {
	organization?: string
}

export const apiOrganizationCommandBuilder = <T extends object>(yargs: Argv<T>): Argv<T & APIOrganizationCommandFlags> =>
	apiCommandBuilder(yargs)
		.option('organization', { alias: 'O', desc: 'the organization id to use for this command', type: 'string' })

export type APIOrganizationCommand<T extends APIOrganizationCommandFlags> = APICommand<T>

/**
 * Base for commands that need to use Rest API via the SmartThings Core SDK and can act on the
 * behalf of different organizations.
 */
export const apiOrganizationCommand = async <T extends APIOrganizationCommandFlags>(flags: T): Promise<APIOrganizationCommand<T>> =>
	apiCommand(flags, (stCommand: SmartThingsCommand<T>, headers: HttpClientHeaders): void => {
		if (flags.organization) {
			headers['X-ST-Organization'] = flags.organization
		} else {
			const configOrganization = stCommand.stringConfigValue('organization')
			if (configOrganization) {
				headers['X-ST-Organization'] = configOrganization
			}
		}
	})
