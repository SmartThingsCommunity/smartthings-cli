import { type Argv, type CommandModule } from 'yargs'


import { buildEpilog } from '../lib/help.js'


const command = 'edge'

const describe = 'edge-specific commands'

const builder = (yargs: Argv): Argv =>
	yargs.epilog(buildEpilog({ command }))

const handler = (): void => {
	// Handler is required by yargs but we leave it empty because `edge` is only a topic.
}

const cmd: CommandModule<object> = { command, describe, builder, handler }
export default cmd
