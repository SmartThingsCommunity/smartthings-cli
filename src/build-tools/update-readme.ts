import { readFile, writeFile } from 'node:fs/promises'
import { EOL } from 'node:os'

import { CommandModule } from 'yargs'

import { commands } from '../commands/index.js'


const beginMarker = '<!-- BEGIN: commands -->'
const endMarker = '<!-- END: commands -->'

const commandSummary = (command: CommandModule<object, unknown>): string => {
	if (typeof command.command === 'string') {
		return command.command
	}

	throw Error('currently unsupported command type')
}

const commandREADMELines = [
	'<!-- Do not manually this file between the "BEGIN commands" and "END commands" comments. -->',
	'| Command | Description |',
	'| -- | -- |',
]
const readmeContents = (await readFile('README.md', 'utf-8')).split(EOL)
console.log(`README has ${readmeContents.length} lines.`)

const beginIndex = readmeContents.findIndex(line => line === beginMarker)
const endIndex = readmeContents.findIndex(line => line === endMarker)

if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
	throw Error(`Invalid README file. begin: ${beginIndex}, end: ${endIndex}`)
}

for (const command of commands) {
	commandREADMELines.push(`| ${commandSummary(command)} | ${command.describe} |`)
}

const mcUpdatedReadmeContents = readmeContents.toSpliced(
	beginIndex + 1,
	endIndex - beginIndex - 1,
	...commandREADMELines,
)

await writeFile('README.md', mcUpdatedReadmeContents.join('\n'))

console.log('updated README file')
