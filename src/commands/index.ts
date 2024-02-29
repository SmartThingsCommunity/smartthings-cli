import { CommandModule } from 'yargs'

import appsCommand from './apps.js'
import configCommand from './config.js'
import devicepreferencesCommand from './devicepreferences.js'
import locationsCommand from './locations.js'
import locationsCreateCommand from './locations/create.js'
import locationsDeleteCommand from './locations/delete.js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	appsCommand,
	configCommand,
	devicepreferencesCommand,
	locationsCommand,
	locationsCreateCommand,
	locationsDeleteCommand,
]
