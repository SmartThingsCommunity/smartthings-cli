import { join } from 'node:path'

import yaml from 'js-yaml'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Profile } from '../lib/cli-config.js'
import { type TableFieldDefinition } from '../lib/table-generator.js'
import { stringTranslateToId } from '../lib/command/command-util.js'
import { type OutputItemOrListFlags, outputItemOrListBuilder } from '../lib/command/listing-io.js'
import { calculateOutputFormat, writeOutput } from '../lib/command/output.js'
import { outputItem } from '../lib/command/output-item.js'
import { type OutputListConfig, outputList } from '../lib/command/output-list.js'
import { buildOutputFormatter } from '../lib/command/output-builder.js'
import {
	type SmartThingsCommandFlags,
	smartThingsCommand,
	smartThingsCommandBuilder,
} from '../lib/command/smartthings-command.js'


export type ProfileWithName = {
	name: string
	profile: Profile
}

export type CommandArgs = SmartThingsCommandFlags & OutputItemOrListFlags & {
	verbose: boolean
	name?: string
}

const command = 'config [name]'

const describe = 'list profiles defined in config file'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(smartThingsCommandBuilder(yargs))
		.positional('name', { describe: 'profile name for detail view', type: 'string' })
		.option('verbose',
			{ alias: 'v', describe: 'include additional data in output', type: 'boolean', default: false })
		.example([
			['$0 config', 'summarize profiles in config file'],
			['$0 config my-org-1', 'provide details for profile named "my-org-1"'],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await smartThingsCommand(argv)
	const listTableFieldDefinitions: TableFieldDefinition<ProfileWithName>[] = [
		'name',
		{ label: 'Active', value: item => item.name === command.profileName ? 'true' : '' },
	]
	const tableFieldDefinitions: TableFieldDefinition<ProfileWithName>[] = [
		...listTableFieldDefinitions,
		{ label: 'Definition', value: item => yaml.dump(item.profile) },
	]

	const outputListConfig: OutputListConfig<ProfileWithName> = {
		primaryKeyName: 'name',
		sortKeyName: 'name',
		listTableFieldDefinitions,
	} as const
	if (argv.verbose) {
		listTableFieldDefinitions.push({ path: 'profile.token' })
	}

	const baseURLValue = (item: ProfileWithName): string | undefined =>
		(item.profile?.clientIdProvider as undefined | Record<string, string>)?.baseURL
	const getConfig = async (name: string): Promise<ProfileWithName> => {
		const config = command.cliConfig.mergedProfiles
		return { name, profile: config[name] }
	}
	const listConfigs = async (): Promise<ProfileWithName[]> => {
		const config = command.cliConfig.mergedProfiles
		const list = Object.keys(config).map(it => {
			return { name: it, profile: config[it] }
		})
		// This is a little iffy since we could end up updating `listTableFieldDefinitions`
		// more than once if `listConfigs` is called more than once but we don't. (We actively
		// avoid calling it multiple times in functions we pass it too because they usually get
		// passed functions that make API calls.)
		if (argv.verbose && list.some(baseURLValue)) {
			listTableFieldDefinitions.push({ label: 'API URL', value: baseURLValue })
		}
		return list
	}

	if (argv.name) {
		const profileName = await stringTranslateToId(outputListConfig, argv.name, listConfigs)
		await outputItem(command, { tableFieldDefinitions }, () => getConfig(profileName))
	} else {
		const outputFormat = calculateOutputFormat(argv)
		if (outputFormat === 'common') {
			console.log('The CLI configuration file on your machine is:\n' +
				`    ${join(command.configDir, 'config.yaml')}\n`)
			await outputList(command, outputListConfig, listConfigs, { includeIndex: true })
		} else {
			const outputFormatter = buildOutputFormatter(command.flags, command.cliConfig)
			await writeOutput(outputFormatter(command.cliConfig.mergedProfiles), argv.output)
		}
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
