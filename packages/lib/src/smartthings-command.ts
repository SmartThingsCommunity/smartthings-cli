import Command, { flags } from '@oclif/command'
import { Logger } from '@smartthings/core-sdk'
import { logManager } from './logger'


/**
 * The base class for all commands.
 */
export abstract class SmartThingsCommand extends Command {
	static flags = {
		help: flags.help({ char: 'h' }),
	}

	private _logger?: Logger
	protected get logger(): Logger {
		if (!this._logger) {
			this._logger = logManager.getLogger('cli')
		}
		return this._logger
	}
}
