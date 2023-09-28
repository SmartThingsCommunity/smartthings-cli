import { CommandModule } from 'yargs'

import appsCommand from './apps.js'
import configCommand from './config.js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	appsCommand,
	configCommand,
]
