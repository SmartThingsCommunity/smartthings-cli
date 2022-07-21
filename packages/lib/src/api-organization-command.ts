import { Flags } from '@oclif/core'

import { HttpClientHeaders } from '@smartthings/core-sdk'

import { APICommand } from './api-command'


const ORGANIZATION_HEADER = 'X-ST-Organization'

/**
 * Base class for commands that need to use Rest API commands via the
 * SmartThings Core SDK and can act on the behalf of different organizations.
 */
export abstract class APIOrganizationCommand<T extends typeof APIOrganizationCommand.flags> extends APICommand<T> {
	static flags = {
		...APICommand.flags,
		organization: Flags.string({
			char: 'O',
			description: 'the organization ID to use for this command',
		}),
	}

	async initHeaders(): Promise<HttpClientHeaders> {
		const headers = await super.initHeaders()

		if (this.flags.organization) {
			headers[ORGANIZATION_HEADER] = this.flags.organization
		} else {
			const configOrganization = this.stringConfigValue('organization')
			if (configOrganization) {
				headers[ORGANIZATION_HEADER] = configOrganization
			}
		}

		return headers
	}
}
