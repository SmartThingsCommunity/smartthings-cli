import fs from 'fs'

import { Flags } from '@oclif/core'
import JSZip from 'jszip'

import { outputItem, readFile } from '@smartthings/cli-lib'

import { buildTestFileMatchers, processConfigFile, processFingerprintsFile, processProfiles,
	processSrcDir, resolveProjectDirName } from '../../../lib/commands/drivers/package-util'
import { chooseChannel } from '../../../lib/commands/channels-util'
import { chooseHub } from '../../../lib/commands/drivers-util'
import { EdgeCommand } from '../../../lib/edge-command'


export default class PackageCommand extends EdgeCommand<typeof PackageCommand.flags> {
	static description = 'build and upload an edge package'

	static args = [{
		name: 'projectDirectory',
		description: 'directory containing project to upload',
		default: '.',
	}]

	static flags = {
		...EdgeCommand.flags,
		...outputItem.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'build-only': Flags.string({
			char: 'b',
			description: 'save package to specified zip file but skip upload',
			exclusive: ['upload'],
		}),
		upload: Flags.string({
			char: 'u',
			description: 'upload zip file previously built with --build flag',
			exclusive: ['build-only'],
		}),
		assign: Flags.boolean({
			char: 'a',
			description: 'prompt for a channel to assign the driver to after upload',
			exclusive: ['channel', 'build-only'],
		}),
		channel: Flags.string({
			description: 'automatically assign driver to specified channel after upload',
			exclusive: ['assign', 'build-only'],
			helpValue: '<UUID>',
		}),
		install: Flags.boolean({
			char: 'I',
			description: 'prompt for hub to install to after assigning it to the channel, implies --assign if --assign or --channel not included',
			exclusive: ['hub', 'build-only'],
		}),
		hub: Flags.string({
			description: 'automatically install driver to specified hub, implies --assign if --assign or --channel not included',
			exclusive: ['install', 'build-only'],
			helpValue: '<UUID>',
		}),
	}

	static examples = [`# build and upload driver found in current directory:
$ smartthings edge:drivers:package

# build and upload driver found in current directory, assign it to a channel, and install it;
# user will be prompted for channel and hub
$ smartthings edge:drivers:package -I

# build and upload driver found in current directory then assign it to the specified channel
# and install it to the specified hub
$ smartthings edge:drivers:package --channel <channel-id> --hub <hubId>

# build and upload driver found in the my-driver directory
$ smartthings edge:drivers:package my-driver

# build the driver in the my-package directory and save it as driver.zip
$ smartthings edge:drivers:package -b driver.zip my-package`,
	`
# upload the previously built driver found in driver.zip
$ smartthings edge:drivers:package -u driver.zip`]

	async run(): Promise<void> {
		const uploadAndPostProcess = async (archiveData: Uint8Array): Promise<void> => {
			const config = {
				tableFieldDefinitions: ['driverId', 'name', 'packageKey', 'version'],
			}
			const driver = await outputItem(this, config, () => this.client.drivers.upload(archiveData))
			const doAssign = this.flags.assign || this.flags.channel || this.flags.install || this.flags.hub
			const doInstall = this.flags.install || this.flags.hub
			if (doAssign) {
				const driverId = driver.driverId
				const version = driver.version
				const channelId = await chooseChannel(this, 'Select a channel for the driver.',
					this.flags.channel, { useConfigDefault: true })
				await this.client.channels.assignDriver(channelId, driverId, version)
				this.log(`assigned driver ${driverId} ${version} to channel ${channelId}`)

				if (doInstall) {
					const hubId = await chooseHub(this, 'Select a hub to install to.', this.flags.hub,
						{ useConfigDefault: true })
					await this.client.hubdevices.installDriver(driverId, hubId, channelId)
					this.log(`installed driver ${driverId} ${version} to hub ${hubId}`)
				}
			}
		}

		if (this.flags.upload) {
			try {
				const data = await readFile(this.flags.upload)
				await uploadAndPostProcess(data)
			} catch (error) {
				if ((error as { code?: string }).code === 'ENOENT') {
					this.log(`No file named "${this.flags.upload}" found.`)
				} else {
					throw error
				}
			}
		} else {
			const projectDirectory = await resolveProjectDirName(this.args.projectDirectory)

			const zip = new JSZip()
			await processConfigFile(projectDirectory, zip)

			await processFingerprintsFile(projectDirectory, zip)
			const edgeDriverTestDirs = this.stringArrayConfigValue('edgeDriverTestDirs', ['test/**', 'tests/**'])
			const testFileMatchers = buildTestFileMatchers(edgeDriverTestDirs)
			if (!await processSrcDir(projectDirectory, zip, testFileMatchers)) {
				this.exit(1)
			}

			await processProfiles(projectDirectory, zip)
			if (this.flags['build-only']) {
				zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' })
					.pipe(fs.createWriteStream(this.flags['build-only']))
					.on('finish', () => {
						this.log(`wrote ${this.flags['build-only']}`)
					})
			} else {
				const zipContents = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
				await uploadAndPostProcess(zipContents)
			}
		}
	}
}
