import { type Channel } from '@smartthings/core-sdk'

import { type TableFieldDefinition } from '../../../table-generator.js'


export const listTableFieldDefinitions: TableFieldDefinition<Channel>[] =
	['channelId', 'name', 'createdDate', 'lastModifiedDate']

export const tableFieldDefinitions: TableFieldDefinition<Channel>[] =
	['channelId', 'name', 'description', 'termsOfServiceUrl', 'createdDate', 'lastModifiedDate']
