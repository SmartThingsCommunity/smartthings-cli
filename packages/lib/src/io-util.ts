import log4js from '@log4js-node/log4js-api'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'


export const readFile = fs.promises.readFile
export const writeFile = fs.promises.writeFile

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
	log4js.getLogger('cli').warn(`could not determine file type from filename "${filename}, assuming YAML`)
	return IOFormat.YAML
}


export function parseJSONOrYAML<T>(rawInputData: string, source: string): T {
	const data = yaml.load(rawInputData)
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

/**
 * Check for existence of YAML file.
 * Enforces official file extension and warns user if incorrect file detected.
 */
export function yamlExists(filepath: string): boolean {
	const parsedPath = path.parse(filepath)

	if (parsedPath.ext !== '.yaml') {
		throw Error(`Invalid file extension: ${parsedPath.ext}`)
	}

	if (!fs.existsSync(filepath)) {
		const ymlPath = path.format({
			dir: parsedPath.dir,
			name: parsedPath.name,
			ext: '.yml',
		})

		if (fs.existsSync(ymlPath)) {
			console.error(`Ignoring ${ymlPath} and using default. Please use ".yaml" extension instead.`)
		}

		return false
	}

	return true
}
