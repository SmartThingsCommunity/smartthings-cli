import { Command } from '@oclif/core'

import { SmartThingsCommand } from '@smartthings/cli-lib'


/**
 * There is no top-level command for the `edge` topic, so we provide this stub to give
 * oclif a description of the topic.
 */
export default class EdgeCommand extends Command {
	static description = 'edge topic'

	static flags = { help: SmartThingsCommand.flags.help }

	async run(): Promise<void> {
		this.log('Run "smartthings edge --help" for info on the edge topic.')
	}
}
