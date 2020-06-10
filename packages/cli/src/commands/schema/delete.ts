import { SchemaApp } from '@smartthings/core-sdk'

import { SelectingInputAPICommand } from '@smartthings/cli-lib'


export default class SchemaAppDeleteCommand extends SelectingInputAPICommand<SchemaApp> {
	static description = 'delete the ST Schema connector'

	static flags = SelectingInputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	primaryKeyName = 'endpointAppId'
	sortKeyName = 'appName'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => await this.client.schema.list(),
			async (id) => { await this.client.schema.delete(id) },
			'schema app {{id}} deleted')
	}
}
