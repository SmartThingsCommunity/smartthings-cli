import fs from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import pack from '@vercel/ncc'
import archiver from 'archiver'
import { compile } from 'nexe'


const targets = [
	'linux-arm64',
	'linux-x64',
	'mac-arm64',
	// The Intel Mac Build still isn't working properly yet.
	// 'mac-x64',
	'windows-x64',
]
const nodeVersion = process.version.substring(1)

// This allows us to the the binary either:
//   node dist/src/build-tools/build-binaries.js # after building of course
//   tsx src/build-tools/build-binaries.ts
const workspaceDir = import.meta.dirname.endsWith('dist/src/build-tools')
	? path.join(import.meta.dirname, '..', '..', '..')
	: path.join(import.meta.dirname, '..', '..')
console.log(`import.meta.dirname = ${import.meta.dirname}`)
console.log(`workspaceDir = ${workspaceDir}`)
const distBinDir = path.join(workspaceDir, 'dist_bin')
await mkdir(distBinDir, { recursive: true })

// First pack into a single JavaScript file using ncc.
const { code } = await pack(
	path.join(workspaceDir, 'dist/src/run.js'),
	{
		// An error occurs while minifying so it doesn't happen anyway. Skip for now.
		// (It probably wouldn't make much difference anyway in this situation.)
		// minify: true,
	},
)

const packFile = path.join(distBinDir, 'smartthings.mjs')
console.log(`Writing packed JavaScript to ${packFile}`)
await writeFile(packFile, code)

const buildAndZipTarget = async (target: string): Promise<void> => {
	console.log(`Compiling for ${target}:`)
	const binDir = path.join(distBinDir, target)
	const binaryFilename = `smartthings${target.startsWith('windows') ? '.exe' : ''}`
	const fullBinaryFilename = path.join(binDir, binaryFilename)
	await compile({
		name: 'smartthings',
		input: packFile,
		resources: ['package.json'],
		remote: 'https://github.com/SmartThingsCommunity/cli-nexe-builds/releases/download/1.0.0',
		output: fullBinaryFilename,
		python: 'python3',
		targets: [`${target}-${nodeVersion}`],
	})

	console.log(`Compressing ${target}`)

	const [platform, arch] = target.split('-')
	const [archiveExt, compressionFormat, config]: [string, archiver.Format, archiver.ArchiverOptions] =
		platform === 'windows'
			? ['zip', 'zip', {}]
			: ['tgz', 'tar', { gzip: true }]

	const archiveName = path.join(binDir, `smartthings-${platform}-${arch}.${archiveExt}`)

	const archive = archiver(compressionFormat, config)
	archive.append(fs.createReadStream(fullBinaryFilename), { name: binaryFilename, mode: 0o755 })
	archive.pipe(fs.createWriteStream(archiveName))

	return archive.finalize()
}

const buildPromises = []
for (const target of targets) {
	buildPromises.push(buildAndZipTarget(target))
}
await Promise.all(buildPromises)
