import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'

import JSZip from 'jszip'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type EdgeDriver } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { fatalError } from '../../../lib/util.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { outputItem, outputItemBuilder, type OutputItemConfig } from '../../../lib/command/output-item.js'
import {
	buildTestFileMatchers,
	processConfigFile,
	processFingerprintsFile,
	processProfiles,
	processSearchParametersFile,
	processSrcDir,
	resolveProjectDirName,
} from '../../../lib/command/util/edge-driver-package.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'
import { chooseChannel } from '../../../lib/command/util/edge/channels-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& {
		projectDirectory?: string
		buildOnly?: string
		upload?: string
		assign?: boolean
		channel?: string
		install?: boolean
		hub?: string
	}

const command = 'edge:drivers:package [project-directory]'

const describe = 'build and upload an edge package'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional(
			'project-directory',
			{ describe: 'directory containing project to upload', type: 'string', default: '.' },
		)
		.option(
			'build-only',
			{
				alias: 'b',
				describe: 'save package to specified zip file but skip upload',
				type: 'string',
				conflicts: ['upload'],
			},
		)
		.option(
			'upload',
			{
				alias: 'u',
				describe: 'upload zip file previously built with --build flag',
				type: 'string',
				conflicts: ['build-only'],
			},
		)
		.option(
			'assign',
			{
				alias: 'a',
				describe: 'prompt for a channel (or use default if one is set) to assign the driver to after upload',
				type: 'boolean',
				conflicts: ['channel', 'build-only'],
			},
		)
		.option(
			'channel',
			{
				alias: 'C',
				describe: 'automatically assign driver to specified channel after upload',
				type: 'string',
				conflicts: ['assign', 'build-only'],
			})
		.option(
			'install',
			{
				alias: 'I',
				describe: 'prompt for hub (or use default if one is set) to install to after assigning it' +
					' to the channel, implies --assign if --assign or --channel not included',
				type: 'boolean',
				conflicts: ['hub', 'build-only'],
			},
		)
		.option(
			'hub',
			{
				describe: 'automatically install driver to specified hub, implies --assign if --assign or --channel' +
					' not included',
				type: 'string',
				conflicts: ['install', 'build-only'],
			})
		.example([
			['$0 edge:drivers:package', 'build and upload driver found in current directory'],
			[
				'$0 edge:drivers:package --install',
				'build and upload driver found in current directory, assign it to a channel, and install it; you will' +
					' be prompted for channel and hub',
			],
			[
				'$0 edge:drivers:package --channel 78f1ec15-96fb-419b-aa02-72d7921830a0' +
					' --hub a90dc5d9-c0b8-473b-b91f-35262b73466d',
				'build and upload driver found in current directory then assign it to the specified channel and' +
					' install it to the specified hub',
			],
			[
				'$0 edge:drivers:package my-driver',
				'build and upload driver found in the my-driver directory',
			],
			[
				'$0 edge:drivers:package --build-only driver.zip my-package',
				'build the driver in the my-package directory and save it as driver.zip',
			],
			[
				'$0 edge:drivers:package --upload driver.zip',
				'upload the previously built driver found in driver.zip',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'uploadDriverPackage' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const uploadAndPostProcess = async (archiveData: Uint8Array): Promise<void> => {
		const config: OutputItemConfig<EdgeDriver> = {
			tableFieldDefinitions: ['driverId', 'name', 'packageKey', 'version'],
		}
		const driver = await outputItem(command, config, () => command.client.drivers.upload(archiveData))
		const doAssign = argv.assign || argv.channel || argv.install || argv.hub
		const doInstall = argv.install || argv.hub
		if (doAssign) {
			const driverId = driver.driverId
			const version = driver.version
			const channelId = await chooseChannel(
				command,
				argv.channel,
				{ useConfigDefault: true, promptMessage: 'Select a channel for the driver.' },
			)
			await command.client.channels.assignDriver(channelId, driverId, version)
			console.log(`Assigned driver ${driverId} (version ${version}) to channel ${channelId}.`)

			if (doInstall) {
				const hubId = await chooseHub(
					command,
					argv.hub,
					{ promptMessage: 'Select a hub to install to.', useConfigDefault: true },
				)
				await command.client.hubdevices.installDriver(driverId, hubId, channelId)
				console.log(`Installed driver ${driverId} (version ${version}) to hub ${hubId}.`)
			}
		}
	}

	if (argv.upload) {
		try {
			const data = await readFile(argv.upload)
			await uploadAndPostProcess(data)
		} catch (error) {
			if ((error as { code?: string }).code === 'ENOENT') {
				return fatalError(`No file named "${argv.upload}" found.`)
			} else {
				throw error
			}
		}
	} else {
		const projectDirectory = await resolveProjectDirName(argv.projectDirectory ?? '.')

		const zip = new JSZip()
		await processConfigFile(projectDirectory, zip)

		await processFingerprintsFile(projectDirectory, zip)
		await processSearchParametersFile(projectDirectory, zip)
		const edgeDriverTestDirs = command.cliConfig.stringArrayConfigValue(
			'edgeDriverTestDirs',
			['test/**', 'tests/**'],
		)
		const testFileMatchers = buildTestFileMatchers(edgeDriverTestDirs)
		if (!await processSrcDir(projectDirectory, zip, testFileMatchers)) {
			// eslint-disable-next-line no-process-exit
			process.exit(1)
		}

		await processProfiles(projectDirectory, zip)
		if (argv.buildOnly) {
			zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' })
				.pipe(createWriteStream(argv.buildOnly))
				.on('finish', () => {
					console.log(`wrote ${argv.buildOnly}`)
				})
		} else {
			const zipContents = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
			await uploadAndPostProcess(zipContents)
		}
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
