import { createReadStream, readdirSync } from 'node:fs'

import type JSZip from 'jszip'
import picomatch from 'picomatch'

import {
	fileExists,
	findYAMLFilename,
	isDir,
	isFile,
	isSymbolicLink,
	readYAMLFile,
	realPathForSymbolicLink,
	requireDir,
	type YAMLFileData,
} from '../../file-util.js'
import { fatalError } from '../../util.js'


export const resolveProjectDirName = async (projectDirNameFromArgs: string): Promise<string> => {
	let calculatedProjectDirName = projectDirNameFromArgs
	if (calculatedProjectDirName.endsWith('/')) {
		calculatedProjectDirName = calculatedProjectDirName.slice(0, -1)
	}
	if (!await isDir(calculatedProjectDirName)) {
		return fatalError(`${calculatedProjectDirName} must exist and be a directory`)
	}
	return calculatedProjectDirName
}

export const processConfigFile = async (projectDirectory: string, zip: JSZip): Promise<YAMLFileData> => {
	const configFile = await findYAMLFilename(`${projectDirectory}/config`)
	if (configFile === false) {
		return fatalError('missing main config.yaml (or config.yml) file')
	}

	const parsedConfig = readYAMLFile(configFile)

	zip.file('config.yml', createReadStream(configFile))

	return parsedConfig
}

export const processOptionalYAMLFile = async (
		baseFilename: string,
		projectDirectory: string,
		zip: JSZip,
): Promise<void> => {
	const yamlFile = await findYAMLFilename(`${projectDirectory}/${baseFilename}`)
	if (yamlFile !== false) {
		// validate file is at least parsable as a YAML file
		readYAMLFile(yamlFile)
		zip.file(`${baseFilename}.yml`, createReadStream(yamlFile))
	}
}

export const processFingerprintsFile = async (projectDirectory: string, zip: JSZip): Promise<void> =>
	processOptionalYAMLFile('fingerprints', projectDirectory, zip)

export const processSearchParametersFile = async (projectDirectory: string, zip: JSZip): Promise<void> =>
	processOptionalYAMLFile('search-parameters', projectDirectory, zip)

export const buildTestFileMatchers = (matchersFromConfig: string[]): picomatch.Matcher[] =>
	matchersFromConfig.map(glob => picomatch(glob))

export const processSrcDir = async (
		projectDirectory: string,
		zip: JSZip,
		testFileMatchers: picomatch.Matcher[],
): Promise<boolean> => {
	const srcDir = await requireDir(`${projectDirectory}/src`)
	if (!await isFile(`${srcDir}/init.lua`)) {
		return fatalError(`missing required ${srcDir}/init.lua file`)
	}

	let successful = true
	const fatalIssue = (message: string): void => {
		successful = false
		console.error(message)
	}

	// The max depth is 10 but the main project directory and the src directory itself count,
	// so we start at 2.
	const walkDir = async (fromDir: string, nested = 2): Promise<void> => {
		await Promise.all(readdirSync(fromDir).map(async filename => {
			const fullFilename = `${fromDir}/${filename}`
			if (await fileExists(fullFilename)) {
				const isLink = await isSymbolicLink(fullFilename)
				const resolvedFilename = isLink ? await realPathForSymbolicLink(fullFilename) : fullFilename
				if (await isDir(resolvedFilename)) {
					if (isLink) {
						fatalIssue(`sym links to directories are not allowed (${fullFilename})`)
					} else {
						// maximum depth is defined by server
						if (nested < 10) {
							await walkDir(fullFilename, nested + 1)
						} else {
							fatalIssue(`drivers directory nested too deeply (at ${fullFilename}); max depth is 10`)
						}
					}
				} else {
					const filenameForTestMatch = fullFilename.substring(srcDir.length + 1)
					if (!testFileMatchers.some(matcher => matcher(filenameForTestMatch))) {
						const archiveName = `src${fullFilename.substring(srcDir.length)}`
						zip.file(archiveName, createReadStream(fullFilename))
					}
				}
			} else {
				fatalIssue(`sym link ${fullFilename} points to non-existent file`)
			}
		}))
	}

	await walkDir(srcDir)
	return successful
}

export const processProfiles = async (projectDirectory: string, zip: JSZip): Promise<void> => {
	const profilesDir = await requireDir(`${projectDirectory}/profiles`)

	for (const filename of readdirSync(profilesDir)) {
		const fullFilename = `${profilesDir}/${filename}`
		if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
			// read and parse to make sure profiles are at least valid yaml
			readYAMLFile(fullFilename)
			let archiveName = `profiles${fullFilename.substring(profilesDir.length)}`
			if (archiveName.endsWith('.yaml')) {
				archiveName = `${archiveName.slice(0, -4)}yml`
			}
			zip.file(archiveName, createReadStream(fullFilename))
		} else {
			return fatalError(`invalid profile file "${fullFilename}" (must have .yaml or .yml extension)`)
		}
	}
}
