import { readFileSync } from 'node:fs'
import { lstat, mkdir, realpath, stat } from 'node:fs/promises'

import yaml from 'js-yaml'

import { fatalError } from './util.js'


export const fileExists = async (path: string): Promise<boolean> => {
	try {
		await stat(path)
		return true
	} catch (error) {
		if (error.code === 'ENOENT') {
			return false
		}
		throw error
	}
}

export const isFile = async (path: string): Promise<boolean> =>
	await fileExists(path) && (await stat(path)).isFile()

export const isDir = async (path: string): Promise<boolean> =>
	await fileExists(path) && (await stat(path)).isDirectory()

export const isSymbolicLink = async (path: string): Promise<boolean> =>
	(await lstat(path)).isSymbolicLink()

export const realPathForSymbolicLink = async (path: string): Promise<string> =>
	await realpath(path)

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
	return fatalError(`missing required directory: ${dirName}`)
}

export const ensureDir = async (dirname: string): Promise<void> => {
	try {
		const fileInfo = await stat(dirname)
		if (!fileInfo.isDirectory()) {
			throw Error(`${dirname} already exists but is not a directory`)
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			await mkdir(dirname, { recursive: true })
		} else {
			throw error
		}
	}
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
		const data = yaml.load(readFileSync(filename, 'utf-8'))
		if (isYAMLFileData(data)) {
			return data
		}

		if (data == null) {
			return fatalError(`empty file ${filename}`)
		}

		return fatalError(`invalid file ${filename}`)
	} catch (error) {
		return fatalError(`error "${error.message}" reading ${filename}`)
	}
}
