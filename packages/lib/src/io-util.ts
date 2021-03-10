import fs from 'fs'
import path from 'path'
import util from 'util'
import yaml from 'js-yaml'

import { logManager } from './logger'


export const readFile = util.promisify(fs.readFile)
export const writeFile = util.promisify(fs.writeFile)

export enum IOFormat {
	YAML = 'yaml',
	JSON = 'json',

	// for input, this is Q & A or command line, for output, it's a human-readable table format
	COMMON = 'common',
}

export function formatFromFilename(filename: string): IOFormat {
	const ext = path.extname(filename).toLowerCase()
	if (ext === '.yaml' || ext === '.yml') {
		return IOFormat.YAML
	}
	if (ext === '.json') {
		return IOFormat.JSON
	}
	logManager.getLogger('cli').warn(`could not determine file type from filename "${filename}, assuming YAML`)
	return IOFormat.YAML
}


export function parseJSONOrYAML<T>(rawInputData: string, source: string): T {
	const data = yaml.safeLoad(rawInputData)
	if (!data) {
		throw Error(`did not get any data from ${source}`)
	}
	if (typeof data === 'string') {
		throw Error(`got simple string from ${source}`)
	}
	return data as unknown as T
}

export function readDataFromStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk.toString())
			})
			stdin.on('end', () => {
				resolve(inputChunks.join(''))
			})
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * Simple function to test for TTY input. Use this instead of directly calling `process` if you want
 * to mock in unit tests.
 */
export function stdinIsTTY(): boolean {
	return process.stdin.isTTY
}

/**
 * Simple function to test for TTY output. Use this instead of directly calling `process` if you want
 * to mock in unit tests.
 */
export function stdoutIsTTY(): boolean {
	return process.stdout.isTTY
}
