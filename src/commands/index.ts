import { CommandModule } from 'yargs'

import appsCommand from './apps.js'
import appsAuthorizeCommand from './apps/authorize.js'
import appsCreateCommand from './apps/create.js'
import appsDeleteCommand from './apps/delete.js'
import appsOAuthCommand from './apps/oauth.js'
import appsOAuthGenerateCommand from './apps/oauth/generate.js'
import appsOAuthUpdateCommand from './apps/oauth/update.js'
import appsRegisterCommand from './apps/register.js'
import appsSettingsCommand from './apps/settings.js'
import appsSettingsUpdateCommand from './apps/settings/update.js'
import appsUpdateCommand from './apps/update.js'
import capabilitiesCommand from './capabilities.js'
import capabilitiesCreateCommand from './capabilities/create.js'
import capabilitiesNamespacesCommand from './capabilities/namespaces.js'
import capabilitiesPresentationCommand from './capabilities/presentation.js'
import capabilitiesPresentationCreateCommand from './capabilities/presentation/create.js'
import capabilitiesPresentationUpdateCommand from './capabilities/presentation/update.js'
import capabilitiesTranslationsCommand from './capabilities/translations.js'
import configCommand from './config.js'
import configResetCommand from './config/reset.js'
import devicepreferencesCommand from './devicepreferences.js'
import devicepreferencesTranslationsCreateCommand from './devicepreferences/translations/create.js'
import deviceprofilesCommand from './deviceprofiles.js'
import devicesCommand from './devices.js'
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
import organizationsCurrentCommand from './organizations/current.js'
import scenesCommand from './scenes.js'
import scenesExecuteCommand from './scenes/execute.js'
import schemaCommand from './schema.js'
import schemaCreateCommand from './schema/create.js'
import virtualdevicesCommand from './virtualdevices.js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commands: CommandModule<object, any>[] = [
	appsCommand,
	appsAuthorizeCommand,
	appsCreateCommand,
	appsDeleteCommand,
	appsOAuthCommand,
	appsOAuthGenerateCommand,
	appsOAuthUpdateCommand,
	appsRegisterCommand,
	appsSettingsCommand,
	appsSettingsUpdateCommand,
	appsUpdateCommand,
	capabilitiesCommand,
	capabilitiesCreateCommand,
	capabilitiesNamespacesCommand,
	capabilitiesPresentationCommand,
	capabilitiesPresentationCreateCommand,
	capabilitiesPresentationUpdateCommand,
	capabilitiesTranslationsCommand,
	configCommand,
	configResetCommand,
	devicepreferencesCommand,
	devicepreferencesTranslationsCreateCommand,
	deviceprofilesCommand,
	devicesCommand,
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
	organizationsCurrentCommand,
	scenesCommand,
	scenesExecuteCommand,
	schemaCommand,
	schemaCreateCommand,
	virtualdevicesCommand,
]
