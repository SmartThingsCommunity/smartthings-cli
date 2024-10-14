import { CommandModule } from 'yargs'

import appsCommand from './apps.js'
import configCommand from './config.js'
import devicepreferencesCommand from './devicepreferences.js'
import devicepreferencesTranslationsCreateCommand from './devicepreferences/translations/create.js'
import deviceprofilesCommand from './deviceprofiles.js'
import devicesCapabilityStatusCommand from './devices/capability-status.js'
import devicesPreferencesCommand from './devices/preferences.js'
import driversCommand from './edge/drivers.js'
import locationsCommand from './locations.js'
import locationsCreateCommand from './locations/create.js'
import locationsDeleteCommand from './locations/delete.js'
import locationsUpdateCommand from './locations/update.js'
import schemaCreateCommand from './schema/create.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	appsCommand,
	configCommand,
	devicepreferencesCommand,
	devicepreferencesTranslationsCreateCommand,
	deviceprofilesCommand,
	devicesCapabilityStatusCommand,
	devicesPreferencesCommand,
	driversCommand,
	locationsCommand,
	locationsCreateCommand,
	locationsDeleteCommand,
	locationsUpdateCommand,
	schemaCreateCommand,
]
