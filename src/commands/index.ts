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
import capabilitiesDeleteCommand from './capabilities/delete.js'
import capabilitiesUpdateCommand from './capabilities/update.js'
import capabilitiesNamespacesCommand from './capabilities/namespaces.js'
import capabilitiesPresentationCommand from './capabilities/presentation.js'
import capabilitiesPresentationCreateCommand from './capabilities/presentation/create.js'
import capabilitiesPresentationUpdateCommand from './capabilities/presentation/update.js'
import capabilitiesTranslationsCommand from './capabilities/translations.js'
import capabilitiesTranslationsCreateCommand from './capabilities/translations/create.js'
import capabilitiesTranslationsUpdateCommand from './capabilities/translations/update.js'
import capabilitiesTranslationsUpsertCommand from './capabilities/translations/upsert.js'
import configCommand from './config.js'
import configResetCommand from './config/reset.js'
import devicepreferencesCommand from './devicepreferences.js'
import devicepreferencesCreateCommand from './devicepreferences/create.js'
import devicepreferencesUpdateCommand from './devicepreferences/update.js'
import devicepreferencesTranslationsCommand from './devicepreferences/translations.js'
import devicepreferencesTranslationsCreateCommand from './devicepreferences/translations/create.js'
import devicepreferencesTranslationsUpdateCommand from './devicepreferences/translations/update.js'
import deviceprofilesCommand from './deviceprofiles.js'
import deviceprofilesCreateCommand from './deviceprofiles/create.js'
import deviceprofilesDeleteCommand from './deviceprofiles/delete.js'
import deviceprofilesDeviceConfigCommand from './deviceprofiles/device-config.js'
import deviceprofilesPresentationCommand from './deviceprofiles/presentation.js'
import deviceprofilesPublishCommand from './deviceprofiles/publish.js'
import deviceprofilesViewCommand from './deviceprofiles/view.js'
import deviceprofilesTranslations from './deviceprofiles/translations.js'
import deviceprofilesTranslationsDelete from './deviceprofiles/translations/delete.js'
import deviceprofilesTranslationsUpsertCommand from './deviceprofiles/translations/upsert.js'
import deviceprofilesUpdateCommand from './deviceprofiles/update.js'
import deviceprofilesViewCreateCommand from './deviceprofiles/view/create.js'
import deviceprofilesViewUpdateCommand from './deviceprofiles/view/update.js'
import devicesCommand from './devices.js'
import devicesCapabilityStatusCommand from './devices/capability-status.js'
import devicesComponentStatusCommand from './devices/component-status.js'
import devicesCommandsCommand from './devices/commands.js'
import devicesDeleteCommand from './devices/delete.js'
import devicesHealthCommand from './devices/health.js'
import devicesHistoryCommand from './devices/history.js'
import devicesPreferencesCommand from './devices/preferences.js'
import devicesPresentationCommand from './devices/presentation.js'
import devicesRenameCommand from './devices/rename.js'
import devicesStatusCommand from './devices/status.js'
import devicesUpdateCommand from './devices/update.js'
import edgeChannelsCommand from './edge/channels.js'
import edgeChannelsAssignCommand from './edge/channels/assign.js'
import edgeChannelsCreateCommand from './edge/channels/create.js'
import edgeChannelsDeleteCommand from './edge/channels/delete.js'
import edgeChannelsDriversCommand from './edge/channels/drivers.js'
import edgeChannelsEnrollCommand from './edge/channels/enroll.js'
import edgeChannelsEnrollmentsCommand from './edge/channels/enrollments.js'
import edgeChannelsInvitesCommand from './edge/channels/invites.js'
import edgeChannelsInvitesAcceptCommand from './edge/channels/invites/accept.js'
import edgeChannelsInvitesCreateCommand from './edge/channels/invites/create.js'
import edgeChannelsInvitesDeleteCommand from './edge/channels/invites/delete.js'
import edgeChannelsMetaInfoCommand from './edge/channels/metainfo.js'
import edgeChannelsUnassignCommand from './edge/channels/unassign.js'
import edgeChannelsUnenrollCommand from './edge/channels/unenroll.js'
import edgeDriversCommand from './edge/drivers.js'
import edgeDriversDefaultCommand from './edge/drivers/default.js'
import edgeDriversDeleteCommand from './edge/drivers/delete.js'
import edgeDriversDevicesCommand from './edge/drivers/devices.js'
import edgeDriversInstallCommand from './edge/drivers/install.js'
import edgeDriversInstalledCommand from './edge/drivers/installed.js'
import edgeDriversLogcatCommand from './edge/drivers/logcat.js'
import edgeDriversPackageCommand from './edge/drivers/package.js'
import edgeDriversPruneCommand from './edge/drivers/prune.js'
import edgeDriversSwitchCommand from './edge/drivers/switch.js'
import edgeDriversUninstallCommand from './edge/drivers/uninstall.js'
import installedappsCommand from './installedapps.js'
import installedappsDeleteCommand from './installedapps/delete.js'
import installedappsRenameCommand from './installedapps/rename.js'
import installedschemaCommand from './installedschema.js'
import installedschemaDeleteCommand from './installedschema/delete.js'
import invitesSchema from './invites/schema.js'
import invitesSchemaCreate from './invites/schema/create.js'
import invitesSchemaDelete from './invites/schema/delete.js'
import locationsCommand from './locations.js'
import locationsCreateCommand from './locations/create.js'
import locationsDeleteCommand from './locations/delete.js'
import locationsHistoryCommand from './locations/history.js'
import locationsUpdateCommand from './locations/update.js'
import locationsModesCommand from './locations/modes.js'
import locationsModesCreateCommand from './locations/modes/create.js'
import locationsModesDeleteCommand from './locations/modes/delete.js'
import locationsModesUpdateCommand from './locations/modes/update.js'
import locationsModesGetCurrentCommand from './locations/modes/getcurrent.js'
import locationsModesSetCurrentCommand from './locations/modes/setcurrent.js'
import locationsRoomsCommand from './locations/rooms.js'
import locationsRoomsCreateCommand from './locations/rooms/create.js'
import locationsRoomsDeleteCommand from './locations/rooms/delete.js'
import locationsRoomsUpdateCommand from './locations/rooms/update.js'
import logoutCommand from './logout.js'
import organizationsCommand from './organizations.js'
import organizationsCurrentCommand from './organizations/current.js'
import presentationCommand from './presentation.js'
import presentationDeviceConfigCommand from './presentation/device-config.js'
import presentationDeviceConfigCreateCommand from './presentation/device-config/create.js'
import presentationDeviceConfigGenerateCommand from './presentation/device-config/generate.js'
import rulesCommand from './rules.js'
import rulesCreateCommand from './rules/create.js'
import rulesDeleteCommand from './rules/delete.js'
import rulesExecuteCommand from './rules/execute.js'
import rulesUpdateCommand from './rules/update.js'
import scenesCommand from './scenes.js'
import scenesExecuteCommand from './scenes/execute.js'
import schemaCommand from './schema.js'
import schemaAuthorizeCommand from './schema/authorize.js'
import schemaCreateCommand from './schema/create.js'
import schemaDeleteCommand from './schema/delete.js'
import schemaRegenerateCommand from './schema/regenerate.js'
import schemaUpdateCommand from './schema/update.js'
import virtualdevicesCommand from './virtualdevices.js'
import virtualdevicesCreateCommand from './virtualdevices/create.js'
import virtualdevicesCreateStandardCommand from './virtualdevices/create-standard.js'
import virtualdevicesDeleteCommand from './virtualdevices/delete.js'
import virtualdevicesEventsCommand from './virtualdevices/events.js'
import virtualdevicesUpdateCommand from './virtualdevices/update.js'


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
	capabilitiesDeleteCommand,
	capabilitiesUpdateCommand,
	capabilitiesNamespacesCommand,
	capabilitiesPresentationCommand,
	capabilitiesPresentationCreateCommand,
	capabilitiesPresentationUpdateCommand,
	capabilitiesTranslationsCommand,
	capabilitiesTranslationsCreateCommand,
	capabilitiesTranslationsUpdateCommand,
	capabilitiesTranslationsUpsertCommand,
	configCommand,
	configResetCommand,
	devicepreferencesCommand,
	devicepreferencesCreateCommand,
	devicepreferencesUpdateCommand,
	devicepreferencesTranslationsCommand,
	devicepreferencesTranslationsCreateCommand,
	devicepreferencesTranslationsUpdateCommand,
	deviceprofilesCommand,
	deviceprofilesCreateCommand,
	deviceprofilesDeleteCommand,
	deviceprofilesDeviceConfigCommand,
	deviceprofilesPresentationCommand,
	deviceprofilesPublishCommand,
	deviceprofilesViewCommand,
	deviceprofilesTranslations,
	deviceprofilesTranslationsDelete,
	deviceprofilesTranslationsUpsertCommand,
	deviceprofilesUpdateCommand,
	deviceprofilesViewCreateCommand,
	deviceprofilesViewUpdateCommand,
	devicesCommand,
	devicesCapabilityStatusCommand,
	devicesComponentStatusCommand,
	devicesCommandsCommand,
	devicesDeleteCommand,
	devicesHealthCommand,
	devicesHistoryCommand,
	devicesPreferencesCommand,
	devicesPresentationCommand,
	devicesRenameCommand,
	devicesStatusCommand,
	devicesUpdateCommand,
	edgeChannelsCommand,
	edgeChannelsAssignCommand,
	edgeChannelsCreateCommand,
	edgeChannelsDeleteCommand,
	edgeChannelsDriversCommand,
	edgeChannelsEnrollCommand,
	edgeChannelsEnrollmentsCommand,
	edgeChannelsInvitesCommand,
	edgeChannelsInvitesAcceptCommand,
	edgeChannelsInvitesCreateCommand,
	edgeChannelsInvitesDeleteCommand,
	edgeChannelsMetaInfoCommand,
	edgeChannelsUnassignCommand,
	edgeChannelsUnenrollCommand,
	edgeDriversCommand,
	edgeDriversDefaultCommand,
	edgeDriversDeleteCommand,
	edgeDriversDevicesCommand,
	edgeDriversInstallCommand,
	edgeDriversInstalledCommand,
	edgeDriversLogcatCommand,
	edgeDriversPackageCommand,
	edgeDriversPruneCommand,
	edgeDriversSwitchCommand,
	edgeDriversUninstallCommand,
	installedappsCommand,
	installedappsDeleteCommand,
	installedappsRenameCommand,
	installedschemaCommand,
	installedschemaDeleteCommand,
	invitesSchema,
	invitesSchemaCreate,
	invitesSchemaDelete,
	locationsCommand,
	locationsCreateCommand,
	locationsDeleteCommand,
	locationsHistoryCommand,
	locationsUpdateCommand,
	locationsModesCommand,
	locationsModesCreateCommand,
	locationsModesDeleteCommand,
	locationsModesUpdateCommand,
	locationsModesGetCurrentCommand,
	locationsModesSetCurrentCommand,
	locationsRoomsCommand,
	locationsRoomsCreateCommand,
	locationsRoomsDeleteCommand,
	locationsRoomsUpdateCommand,
	logoutCommand,
	organizationsCommand,
	organizationsCurrentCommand,
	presentationCommand,
	presentationDeviceConfigCommand,
	presentationDeviceConfigCreateCommand,
	presentationDeviceConfigGenerateCommand,
	rulesCommand,
	rulesCreateCommand,
	rulesDeleteCommand,
	rulesExecuteCommand,
	rulesUpdateCommand,
	scenesCommand,
	scenesExecuteCommand,
	schemaCommand,
	schemaAuthorizeCommand,
	schemaCreateCommand,
	schemaDeleteCommand,
	schemaRegenerateCommand,
	schemaUpdateCommand,
	virtualdevicesCommand,
	virtualdevicesCreateCommand,
	virtualdevicesCreateStandardCommand,
	virtualdevicesDeleteCommand,
	virtualdevicesEventsCommand,
	virtualdevicesUpdateCommand,
]
