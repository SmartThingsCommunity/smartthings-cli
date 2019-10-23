import Command, { flags } from '@oclif/command'


/**
 * The base class for all commands.
 */
export default abstract class SmartThingsCommand extends Command {
	static flags = {
		help: flags.help({ char: 'h' }),
	}
}
