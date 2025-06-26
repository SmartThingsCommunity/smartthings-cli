import { readFile, writeFile } from 'node:fs/promises'

import { getChangelogEntry } from '@changesets/release-utils'


const changelog = await readFile('CHANGELOG.md', 'utf-8')
const version = process.argv[2]

const content = getChangelogEntry(changelog, version).content
await writeFile('RELEASE_NOTES.txt', content)
