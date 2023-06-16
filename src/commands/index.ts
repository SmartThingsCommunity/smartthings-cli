import { CommandModule } from 'yargs'

import configCommand from './config.js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	configCommand,
]
