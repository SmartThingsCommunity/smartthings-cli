import { type InstalledApp } from '@smartthings/core-sdk'
import { type TableFieldDefinition } from '../../table-generator.js'


export const listTableFieldDefinitions: TableFieldDefinition<InstalledApp>[] =
	['displayName', 'installedAppType', 'installedAppStatus', 'installedAppId']

export const tableFieldDefinitions: TableFieldDefinition<InstalledApp>[] = [
	'displayName',
	'installedAppId',
	'installedAppType',
	'installedAppStatus',
	'singleInstance',
	'appId',
	'locationId',
	'singleInstance',
	{
		label: 'Classifications',
		value: installedApp => installedApp.classifications?.join('\n') ?? '',
		include: installedApp => !!installedApp.classifications,
	},
]
