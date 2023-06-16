import fs from 'fs'

import yaml from 'js-yaml'


export const fileExists = async (path: string): Promise<boolean> => {
	try {
		await fs.promises.stat(path)
		return true
	} catch (error) {
		if (error.code === 'ENOENT') {
			return false
		}
		throw error
	}
}

export const isFile = async (path: string): Promise<boolean> =>
	await fileExists(path) && (await fs.promises.stat(path)).isFile()

export const isDir = async (path: string): Promise<boolean> =>
	await fileExists(path) && (await fs.promises.stat(path)).isDirectory()

export const isSymbolicLink = async (path: string): Promise<boolean> =>
	(await fs.promises.lstat(path)).isSymbolicLink()

export const realPathForSymbolicLink = async (path: string): Promise<string> =>
	await fs.promises.realpath(path)

export const findYAMLFilename = async (baseName: string): Promise<string | false> => {
	let retVal = `${baseName}.yaml`
	if (await isFile(retVal)) {
		return retVal
	}

	retVal = `${baseName}.yml`
	if (await isFile(retVal)) {
		return retVal
	}

	return false
}

export const requireDir = async (dirName: string): Promise<string> => {
	if (await isDir(dirName)) {
		return dirName
	}
	// TODO: fix for yargs
	throw Error(`missing required directory: ${dirName}`)
}

export type YAMLFileData = {
	[key: string]: string | object | number | undefined
}

const isYAMLFileData = (data: unknown): data is YAMLFileData => {
	return data !== null &&
		typeof data === 'object' &&
		Object.keys(data).length > 0 &&
		Object.values(data).every(value => ['string', 'object', 'number'].includes(typeof value))
}

export const readYAMLFile = (filename: string): YAMLFileData => {
	try {
		const data = yaml.load(fs.readFileSync(filename, 'utf-8'))
		if (isYAMLFileData(data)) {
			return data
		}

		if (data == null) {
			throw Error('empty file')
		}

		throw Error('invalid file')
	} catch (error) {
		// TODO: fix for yargs
		throw Error(`error "${error.message}" reading ${filename}`)
	}
}
