import { copyFile } from 'node:fs/promises'
import { homedir, platform, tmpdir } from 'node:os'
import { join } from 'node:path'

import { ensureDir, isFile } from './file-util.js'


// This file includes functions for finding old configuration files from before the yargs transition
// and copying them if needed.
//
// It is intended that we will delete this file one year after the release of the yargs version
// of the CLI.


// Code temporarily copied from @oclif/core, version 1.16.3, that determines config and cache
// directories (with some things hard-coded to our values and WSL support removed).
// We are now using the `envPaths` library but want to support users by copying their configs.
// This is planned to be removed 1 year after the transition to yargs has been released.
export const oldDirs = (): { oldConfigDir: string; oldCacheDir: string } => {
	const onWindows = platform() === 'win32'
	const windowsHome  = (process.env.HOMEDRIVE && process.env.HOMEPATH &&
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		join(process.env.HOMEDRIVE!, process.env.HOMEPATH!)) || process.env.USERPROFILE
	const home = process.env.HOME || (onWindows && windowsHome) || homedir() || tmpdir()
	const dirname = '@smartthings/cli'
	const macosCacheDir = (): string | undefined =>
		(platform() === 'darwin' && join(home, 'Library', 'Caches', dirname)) || undefined

	const dir = (category: 'cache' | 'config'): string => {
		const base = process.env[`XDG_${category.toUpperCase()}_HOME`] ||
			(onWindows && process.env.LOCALAPPDATA) || join(home, '.' + category)
		return join(base, dirname)
	}

	return { oldConfigDir: dir('config'), oldCacheDir: macosCacheDir() || dir('cache') }
}

export const copyIfExists = async (
		options: {
			filename: string
			oldDir: string
			newDir: string
			description?: string // when omitted, user is not notified (omit for CLI-managed files)
			verboseLogging: boolean
		},
): Promise<void> => {
	const { filename, oldDir, newDir, description, verboseLogging } = options
	if (oldDir === newDir) {
		// in some situations, the directory might not change
		if (verboseLogging) {
			console.error(`old and new directories (${oldDir}) are the same for ${filename}`)
		}
		return
	}
	const oldFilename = join(oldDir, filename)
	const newFilename = join(newDir, filename)
	const oldExists = await isFile(oldFilename)
	const newExists = await isFile(newFilename)
	if (oldExists && !newExists) {
		if (verboseLogging) {
			console.error(`found old file ${filename} in ${oldDir}; copying to ${newDir}`)
		}
		await ensureDir(newDir)
		await copyFile(oldFilename, newFilename)
		if (description) {
			console.warn(`found old ${description} file ${oldFilename} and copied it to ${newFilename}\n` +
				`from version 2.0, the CLI will use ${newFilename} for ${description}`)
		}
	} else if (verboseLogging) {
		console.error(
			`not copying ${filename} from ${oldDir} to ${newDir}; ` +
			`oldExists=${oldExists}; newExists=${newExists}`,
		)
	}
}
