import { CommandModule } from 'yargs'

import appsCommand from './apps.js'
import appsAuthorizeCommand from './apps/authorize.js'
import appsCreateCommand from './apps/create.js'
import appsDeleteCommand from './apps/delete.js'
import appsOAuth from './apps/oauth.js'
import appsOAuthGenerateCommand from './apps/oauth/generate.js'
import appsOAuthUpdateCommand from './apps/oauth/update.js'
import appsSettingsUpdateCommand from './apps/settings/update.js'
import capabilitiesCommand from './capabilities.js'
import capabilitiesPresentationCommand from './capabilities/presentation.js'
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
import scenesCommand from './scenes.js'
import schemaCommand from './schema.js'
import schemaCreateCommand from './schema/create.js'
import virtualdevicesCommand from './virtualdevices.js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	appsCommand,
	appsAuthorizeCommand,
	appsCreateCommand,
	appsDeleteCommand,
	appsOAuth,
	appsOAuthGenerateCommand,
	appsOAuthUpdateCommand,
	appsSettingsUpdateCommand,
	capabilitiesCommand,
	capabilitiesPresentationCommand,
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
	scenesCommand,
	schemaCommand,
	schemaCreateCommand,
	virtualdevicesCommand,
]
