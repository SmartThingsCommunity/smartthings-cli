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
import capabilitiesTranslationsCreateCommand from './capabilities/translations/create.js'
import capabilitiesTranslationsUpsertCommand from './capabilities/translations/upsert.js'
import configCommand from './config.js'
import configResetCommand from './config/reset.js'
import devicepreferencesCommand from './devicepreferences.js'
import devicepreferencesCreateCommand from './devicepreferences/create.js'
import devicepreferencesTranslationsCommand from './devicepreferences/translations.js'
import devicepreferencesTranslationsCreateCommand from './devicepreferences/translations/create.js'
import devicepreferencesTranslationsUpdateCommand from './devicepreferences/translations/update.js'
import deviceprofilesCommand from './deviceprofiles.js'
import devicesCommand from './devices.js'
import devicesCapabilityStatusCommand from './devices/capability-status.js'
import devicesCommandsCommand from './devices/commands.js'
import devicesPreferencesCommand from './devices/preferences.js'
import edgeDriversCommand from './edge/drivers.js'
import installedappsCommand from './installedapps.js'
import installedappsDeleteCommand from './installedapps/delete.js'
import installedappsRenameCommand from './installedapps/rename.js'
import installedschemaDeleteCommand from './installedschema/delete.js'
import locationsCommand from './locations.js'
import logoutCommand from './logout.js'
import locationsCreateCommand from './locations/create.js'
import locationsDeleteCommand from './locations/delete.js'
import locationsUpdateCommand from './locations/update.js'
import locationsRoomsDeleteCommand from './locations/rooms/delete.js'
import organizationsCommand from './organizations.js'
import organizationsCurrentCommand from './organizations/current.js'
import rulesCommand from './rules.js'
import rulesCreateCommand from './rules/create.js'
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
	capabilitiesTranslationsCreateCommand,
	capabilitiesTranslationsUpsertCommand,
	configCommand,
	configResetCommand,
	devicepreferencesCommand,
	devicepreferencesCreateCommand,
	devicepreferencesTranslationsCommand,
	devicepreferencesTranslationsCreateCommand,
	devicepreferencesTranslationsUpdateCommand,
	deviceprofilesCommand,
	devicesCommand,
	devicesCapabilityStatusCommand,
	devicesCommandsCommand,
	devicesPreferencesCommand,
	edgeDriversCommand,
	installedappsCommand,
	installedappsDeleteCommand,
	installedappsRenameCommand,
	installedschemaDeleteCommand,
	locationsCommand,
	logoutCommand,
	locationsCreateCommand,
	locationsDeleteCommand,
	locationsUpdateCommand,
	locationsRoomsDeleteCommand,
	organizationsCommand,
	organizationsCurrentCommand,
	rulesCommand,
	rulesCreateCommand,
	scenesCommand,
	scenesExecuteCommand,
	schemaCommand,
	schemaCreateCommand,
	virtualdevicesCommand,
]
