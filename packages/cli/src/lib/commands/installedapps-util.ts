import { TableFieldDefinition } from '@smartthings/cli-lib'
import { InstalledApp } from '@smartthings/core-sdk'


export const listTableFieldDefinitions: TableFieldDefinition<InstalledApp>[] =
	['displayName', 'installedAppType', 'installedAppStatus', 'installedAppId']

export const tableFieldDefinitions: TableFieldDefinition<InstalledApp>[] = [
	'displayName', 'installedAppId', 'installedAppType', 'installedAppStatus',
	'singleInstance', 'appId', 'locationId', 'singleInstance',
	{
		label: 'Classifications',
		value: installedApp => installedApp.classifications?.join('\n') ?? '',
		include: installedApp => !!installedApp.classifications,
	},
]
