import { promises as fs } from 'node:fs'
import { type PeerCertificate } from 'node:tls'

import inquirer from 'inquirer'

import { type Sorting } from '../io-defs.js'
import { type DriverInfo } from '../../live-logging.js'
import { askForBoolean } from '../../user-query.js'
import { fatalError } from '../../util.js'
import { convertToId, stringTranslateToId } from '../command-util.js'
import { selectFromList, type SelectFromListConfig } from '../select.js'
import { type SmartThingsCommand } from '../smartthings-command.js'


export const chooseHubDrivers = async (
		command: SmartThingsCommand,
		driversList: DriverInfo[],
		commandLineDriverId?: string,
): Promise<string | undefined> => {
	const config: SelectFromListConfig<DriverInfo> = {
		itemName: 'driver',
		primaryKeyName: 'driver_id',
		sortKeyName: 'driver_name',
		listTableFieldDefinitions: [
			{ prop: 'driver_id', label: 'Driver Id' },
			{ prop: 'driver_name', label: 'Name' },
		],
	}
	const allDriversText = 'all'
	const getIdFromUser = async (
			fieldInfo: Sorting<DriverInfo>,
			list: DriverInfo[],
			prompt?: string,
	): Promise<string> => {
		const primaryKeyName = fieldInfo.primaryKeyName

		const itemIdOrIndex: string = (await inquirer.prompt({
			type: 'input',
			name: 'itemIdOrIndex',
			message: prompt ?? 'Enter id or index',
			default: allDriversText,
			validate: input =>
				input === allDriversText || convertToId(input, primaryKeyName, list)
					? true
					: `Invalid id or index "${input}". Please enter an index or valid id.`,
		})).itemIdOrIndex

		const inputId = itemIdOrIndex === allDriversText
			? itemIdOrIndex
			: convertToId(itemIdOrIndex, primaryKeyName, list)
		if (inputId === false) {
			throw Error(`invalid state; unable to convert ${itemIdOrIndex} to id`)
		}

		return inputId
	}

	const listItems = async (): Promise<DriverInfo[]> => driversList
	const preselectedId = await stringTranslateToId(config, commandLineDriverId, listItems)
	const chosen = await selectFromList(
		command,
		config,
		{ preselectedId, listItems, getIdFromUser },
	)
	return chosen === allDriversText ? undefined : chosen
}

type KnownHub = {
	hostname: string
	fingerprint: string
}

export const getKnownHubs = async (
		knownHubsPath: string,
): Promise<Partial<Record<string, KnownHub>>> => {
	try {
		return JSON.parse(await fs.readFile(knownHubsPath, 'utf-8'))
	} catch (error) {
		if (error.code !== 'ENOENT') { throw error }
	}
	return {}
}

export const checkServerIdentity = async (
		command: SmartThingsCommand,
		authority: string,
		cert: PeerCertificate,
): Promise<void | never> => {
	const knownHubsPath = `${command.dataDir}/known_hubs.json`
	const knownHubs = await getKnownHubs(knownHubsPath)

	const known = knownHubs[authority]
	if (!known || known.fingerprint !== cert.fingerprint) {
		console.warn(`The authenticity of ${authority} can't be established. Certificate fingerprint is` +
			` ${cert.fingerprint}`)
		const verified = await askForBoolean('Are you sure you want to continue connecting?', { default: false })
		if (!verified) {
			return fatalError('Hub verification failed.')
		}

		knownHubs[authority] = { hostname: authority, fingerprint: cert.fingerprint }
		await fs.writeFile(knownHubsPath, JSON.stringify(knownHubs))

		console.warn(`Permanently added ${authority} to the list of known hubs.`)
	}
}
