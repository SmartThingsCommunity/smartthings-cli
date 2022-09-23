// @ts-check

import { readdir, mkdir, rename } from 'fs/promises'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'


/**
 * This script is used to post-process the executables produced by https://github.com/vercel/pkg
 */
const DIST_BIN = 'dist_bin'

const archives = []
const pkgs = (await readdir(DIST_BIN)).filter(name => name.startsWith('cli'))
for (const pkg of pkgs) {
	const targetName = path.basename(pkg, '.exe')

	// pkg names have elements separated by dashes (ex. cli-macos-x64, cli-linux-arm64)
	// if only one arch is specified during build, it is omitted (ex. cli-macos, cli-linux)
	const elements = targetName.split('-')
	const [, platform, arch] = elements.length === 3 ? elements : elements.concat('x64')

	const ext = platform === 'win' ? '.exe' : ''
	const binaryName = `smartthings${ext}`

	const pkgName = path.join(DIST_BIN, pkg)
	const newDir = path.join(DIST_BIN, platform, arch)
	const newName = path.join(newDir, binaryName)

	await mkdir(newDir, { recursive: true })
	await rename(pkgName, newName)

	let archiveExt
	/** @type {archiver.Format} */
	let format
	let config
	if (platform !== 'win') {
		archiveExt = '.tar.gz'
		format = 'tar'
		config = { gzip: true }
	} else {
		archiveExt = '.zip'
		format = 'zip'
		config = {}
	}

	const archiveName = path.join(newDir, `smartthings-${platform}-${arch}${archiveExt}`)

	const archive = archiver(format, config)
	archive.append(fs.createReadStream(newName), { name: binaryName, mode: 0o755 })
	archive.pipe(fs.createWriteStream(archiveName))

	archives.push(archive.finalize())
}

await Promise.all(archives)
