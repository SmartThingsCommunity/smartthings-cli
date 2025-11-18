import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SchemaApp } from '@smartthings/core-sdk'

import { buildEpilog } from '../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../lib/command/api-organization-command.js'
import { AllOrganizationFlags, allOrganizationsBuilder } from '../lib/command/common-flags.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { getSchemaAppEnsuringOrganization } from '../lib/command/util/schema-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputItemOrListFlags
	& AllOrganizationFlags
	& {
		verbose: boolean
		idOrIndex?: string
	}

const command = 'schema [id-or-index]'

const describe = 'list all Schema App links currently available in a user account'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(allOrganizationsBuilder(apiOrganizationCommandBuilder(yargs)))
		.positional(
			'id-or-index',
			{ describe: 'the Schema App link id or number from list', type: 'string' },
		)
		.option('verbose',
			{ alias: 'v', describe: 'include ARNs in table output', type: 'boolean', default: false },
		)
		.example([
			['$0 schema', 'list all Schema App links'],
			[
				'$0 schema 1',
				'display details for the first Schema App link in the list retrieved by running' +
				' "smartthings schema"'],
			['$0 schema 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for a schema' +
				' app link by id'],
			['$0 schema --verbose', 'include ARNs in the output'],
		])
		.epilog(buildEpilog({ command, apiDocs: ['getAppsByUserToken', 'getAppsByEndpointAppId'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const config: OutputItemOrListConfig<SchemaApp> = {
		tableFieldDefinitions: [
			'appName', 'partnerName', 'endpointAppId', 'organizationId', 'schemaType', 'hostingType',
			// stClientId is missing from the docs
			('stClientId' as keyof SchemaApp), 'oAuthAuthorizationUrl', 'oAuthTokenUrl', 'oAuthClientId',
			'oAuthClientSecret', 'icon', 'icon2x', 'icon3x',
			{ prop: 'lambdaArn', skipEmpty: true },
			{ prop: 'lambdaArnAP', skipEmpty: true },
			{ prop: 'lambdaArnCN', skipEmpty: true },
			{ prop: 'lambdaArnEU', skipEmpty: true },
			{ prop: 'webhookUrl', skipEmpty: true },
			{ prop: 'userEmail', skipEmpty: true },
		],
		primaryKeyName: 'endpointAppId',
		sortKeyName: 'appName',
		listTableFieldDefinitions: ['appName', 'endpointAppId', 'organizationId', 'hostingType'],
	}
	if (argv.verbose) {
		config.listTableFieldDefinitions.push({
			label: 'ARN/URL',
			value: app => app.hostingType === 'lambda' ? app.lambdaArn : app.webhookUrl,
		})
	}

	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		() => command.client.schema.list({ includeAllOrganizations: argv.allOrganizations }),
		async id => (await getSchemaAppEnsuringOrganization(command, id, argv)).schemaApp,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
