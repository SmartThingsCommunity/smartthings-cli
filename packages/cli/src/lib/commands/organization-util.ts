import { OrganizationResponse } from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
} from '@smartthings/cli-lib'


export const chooseOrganization = async (
		command: APICommand<typeof APICommand.flags>,
		appFromArg?: string,
		options?: Partial<ChooseOptions<OrganizationResponse>>,
): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<OrganizationResponse> = {
		itemName: 'organization',
		primaryKeyName: 'organizationId',
		sortKeyName: 'name',
	}
	const listItems = (): Promise<OrganizationResponse[]> => command.client.organizations.list()
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, appFromArg, listItems)
		: appFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}
