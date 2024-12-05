import { CommandModule } from 'yargs'

import appsCommand from './apps.js'
import appsCreateCommand from './apps/create.js'
import appsAuthorizeCommand from './apps/authorize.js'
import appsOAuthGenerateCommand from './apps/oauth/generate.js'
import appsOAuthUpdateCommand from './apps/oauth/update.js'
import capabilitiesCommand from './capabilities.js'
import configCommand from './config.js'
import devicepreferencesCommand from './devicepreferences.js'
import devicepreferencesTranslationsCreateCommand from './devicepreferences/translations/create.js'
import deviceprofilesCommand from './deviceprofiles.js'
import devicesCapabilityStatusCommand from './devices/capability-status.js'
import devicesPreferencesCommand from './devices/preferences.js'
import driversCommand from './edge/drivers.js'
import installedappsCommand from './installedapps.js'
import locationsCommand from './locations.js'
import logoutCommand from './logout.js'
import locationsCreateCommand from './locations/create.js'
import locationsDeleteCommand from './locations/delete.js'
import locationsUpdateCommand from './locations/update.js'
import organizationsCommand from './organizations.js'
import schemaCreateCommand from './schema/create.js'
import virtualdevicesCommand from './virtualdevices.js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	appsCommand,
	appsCreateCommand,
	appsAuthorizeCommand,
	appsOAuthGenerateCommand,
	appsOAuthUpdateCommand,
	capabilitiesCommand,
	configCommand,
	devicepreferencesCommand,
	devicepreferencesTranslationsCreateCommand,
	deviceprofilesCommand,
	devicesCapabilityStatusCommand,
	devicesPreferencesCommand,
	driversCommand,
	installedappsCommand,
	locationsCommand,
	logoutCommand,
	locationsCreateCommand,
	locationsDeleteCommand,
	locationsUpdateCommand,
	organizationsCommand,
	schemaCreateCommand,
	virtualdevicesCommand,
]
