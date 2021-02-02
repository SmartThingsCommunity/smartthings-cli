/* eslint-disable @typescript-eslint/ban-ts-comment */
import fs from 'fs'
import inquirer from 'inquirer'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'

import { APICommand } from './api-command'
import { isIndexArgument } from './command-util'
import { commonIOFlags, inputFlag } from './input'
import { formatFromFilename, IOFormat } from './io-util'
import { outputFlags as outputFlag } from './output-builder'
import { Loggable } from './smartthings-command'
import { TableFieldDefinition, TableGenerator } from './table-generator'
import { applyMixins } from './util'


export interface InputOptions {
	// no filename means stdin
	filename?: string
	format: IOFormat
}

export interface OutputOptions {
	// no filename means stdout
	filename?: string
	format: IOFormat
	indentLevel: number
}

export type ListCallback<L> = () => Promise<L[]>
export type GetCallback<O> = () => Promise<O>
export type LookupCallback<ID, O> = (id: ID) => Promise<O>
export type UpdateCallback<ID, I, O> = (id: ID, data: I) => Promise<O>
export type ActionCallback<ID> = (id: ID) => Promise<void>
export type InputActionCallback<ID, I> = (id: ID, data: I) => Promise<void>

export type NestedListCallback<ID, NL> = (id: ID) => Promise<NL[]>
export type NestedGetCallback<ID, NID, O> = (id: ID, nestedId: NID) => Promise<O>
export type NestedUpdateCallback<ID, NID, I, O> = (id: ID, nestedId: NID, data: I) => Promise<O>
export type NestedActionCallback<ID, NID> = (id: ID, nestedId: NID) => Promise<void>
export type NestedInputActionCallback<ID, NID, I> = (id: ID, nestedId: NID, data: I) => Promise<void>

/**
 * Convert and write the data using the given output options.
 *
 * @param buildTableOutput A function that can convert the data to a table
 *   format if that is what is specified in outputOptions.
 * @param forceTableOutput Including this and setting it to true will force
 *   the output to "table" mode. This is used in "selecting" commands that
 *   need to display a list to the user to choose from.
 */
function writeOutputPrivate<T>(data: T, outputOptions: OutputOptions,
		buildTableOutput?: (data: T) => string, forceTableOutput?: boolean): void {
	let output: string

	if (forceTableOutput && buildTableOutput) {
		output = buildTableOutput(data)
	} else if (outputOptions.format === IOFormat.YAML ) {
		output = yaml.safeDump(data, { indent: outputOptions.indentLevel })
	} else if ((outputOptions.format === IOFormat.JSON) || !buildTableOutput) {
		output = JSON.stringify(data, null, outputOptions.indentLevel)
	} else {
		output = buildTableOutput(data)
	}

	if (outputOptions.filename) {
		fs.writeFileSync(outputOptions.filename, output)
	} else {
		process.stdout.write(output)
		if (!output.endsWith('\n')) {
			process.stdout.write('\n')
		}
	}
}

/* eslint-disable no-process-exit */

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface Inputting<I> extends Loggable {}
/**
 * The "Inputting" mixin is used to add the ability of accepting complex
 * input in the form of JSON or YAML (from stdin or a file) to a command.
 *
 * Additionally, this input can be built via command line if
 * hasCommandLineInput and getInputFromCommandLine are implemented.
 * Likewise, implementing getInputFromUser allows a command to also build
 * input from a Q and A session with the user.
 */
export abstract class Inputting<I> {
	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

	/**
	 * Implement this method if you want to build input from command line
	 * options. If this method is implemented, one must also implement
	 * hasCommandLineInput.
	 */
	protected getInputFromCommandLine?(): Promise<I>

	/**
	 * Implement this if and only if getInputFromCommandLine has been
	 * implemented. This should return true if command line arguments are
	 * present that can be used to construct the input.
	 */
	protected hasCommandLineInput?(): boolean

	/**
	 * Implement this method if you want to be able to ask the user for input,
	 * usually in a question and answer format using inquirer.
	 */
	protected getInputFromUser?(): Promise<I>

	protected async readInput(): Promise<I> {
		if (this.hasCommandLineInput && this.hasCommandLineInput()) {
			if (this.getInputFromCommandLine) {
				return this.getInputFromCommandLine()
			} else {
				throw new Error('input is required either via' +
					' file specified with --input option or from stdin')
			}
		}

		if (this.inputOptions.format === IOFormat.COMMON && this.getInputFromUser) {
			return this.getInputFromUser()
		}

		return new Promise<I>((resolve, reject) => {
			if (this.inputOptions.format === IOFormat.COMMON) {
				reject('invalid state')
			} else {
				const finish = (rawInputData: string, filename: string): void => {
					const data = yaml.safeLoad(rawInputData)
					if (!data) {
						reject(`did not get any data from ${filename}`)
					} else if (typeof data === 'string') {
						reject(`got simple string from ${filename}`)
					} else {
						// @ts-ignore
						resolve(data)
					}
				}
				if (this.inputOptions.filename) {
					finish(fs.readFileSync(`${this.inputOptions.filename}`, 'utf-8'), this.inputOptions.filename)
				} else {
					const stdin = process.stdin
					const inputChunks: string[] = []
					stdin.resume()
					stdin.on('data', chunk => {
						inputChunks.push(chunk.toString())
					})
					stdin.on('end', () => {
						finish(inputChunks.join(''), 'stdin')
					})
				}
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		if (this.hasCommandLineInput !== undefined && this.getInputFromCommandLine === undefined
				|| this.hasCommandLineInput === undefined && this.getInputFromCommandLine !== undefined) {
			throw new Error('invalid code; implement both hasCommandLineInput and getInputFromCommandLine or neither')
		}
		let inputFormat: IOFormat
		if (flags.json) {
			inputFormat = IOFormat.JSON
		} else if (flags.yaml) {
			inputFormat = IOFormat.YAML
		} else if (flags.input) {
			inputFormat = formatFromFilename(flags.input)
		} else if (this.getInputFromUser !== undefined && process.stdin.isTTY
				|| this.hasCommandLineInput && this.hasCommandLineInput()) {
			inputFormat = IOFormat.COMMON
		} else {
			inputFormat = IOFormat.YAML
		}

		this._inputOptions = {
			filename: flags.input,
			format: inputFormat,
		}

		if (this._inputOptions.format !== IOFormat.COMMON
				&& !this._inputOptions.filename
				&& process.stdin.isTTY) {
			this.logger.error('input is required either via' +
				' file specified with --input option or from stdin')
			process.exit(1)
		}
	}
}

const inputFlags = {
	...APICommand.flags,
	...commonIOFlags,
	...inputFlag,
}

/**
 * @deprecated use functions from io modules instead
 *
 * Since both Outputting and Listing need OutputOptions, this is a simple
 * mixin that adds it and needs to be included when one or both of those
 * mixins are used.
 */
abstract class Outputable {
	private _outputOptions?: OutputOptions

	protected get outputOptions(): OutputOptions {
		if (!this._outputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._outputOptions
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		let inputOptions: InputOptions | undefined = undefined
		if ('inputOptions' in this) {
			// @ts-ignore
			inputOptions = this.inputOptions
		}

		let outputFormat: IOFormat
		if (flags.json) {
			outputFormat = IOFormat.JSON
		} else if (flags.yaml) {
			outputFormat = IOFormat.YAML
		} else if (flags.output) {
			outputFormat = formatFromFilename(flags.output)
		} else {
			outputFormat = inputOptions ? inputOptions.format : IOFormat.COMMON
		}

		const defaultIndentLevel = outputFormat === IOFormat.YAML ? 2 : 4

		this._outputOptions = {
			filename: flags.output,
			format: outputFormat,
			indentLevel: flags.indent || defaultIndentLevel,
		}
	}
}
interface Outputable {
	readonly tableGenerator: TableGenerator
}

const outputFlags = {
	...APICommand.flags,
	...commonIOFlags,
	...outputFlag,
}

const inputOutputFlags = {
	...inputFlags,
	...outputFlag,
}

/**
 * The "Outputting" mixin is used to add the ability of presenting complex
 * output in the form of JSON, YAML or a more human-readable format.
 * JSON and YAML output are built-in and require no extra implementation but
 * for the more human-readable output (which is the default), one must
 * define the tableFieldDefinitions property or override the buildTableOutput
 * method. See TableFieldDefinition in table-generator.ts for more details
 * for how to build tableFieldDefinitions.
 *
 * NOTE: this mixin requires that Outputable also be mixed in.
 */
export abstract class Outputting<O> extends Outputable {
	protected tableFieldDefinitions?: TableFieldDefinition<O>[]

	/**
	 * Build a string for the "table" output format using the given data.
	 *
	 * This method can be overridden if using tableFieldDefinitions does
	 * not suit your needs.
	 */
	protected buildTableOutput(data: O): string {
		if (!this.tableFieldDefinitions) {
			throw new Error('tableFieldDefinitions is required if ' +
				'buildTableOutput is not overridden')
		}
		return this.tableGenerator.buildTableFromItem(data, this.tableFieldDefinitions)
	}

	/**
	 * This method is used to write the output. It will determine the correct
	 * output format and write the output.
	 *
	 * This method is NOT meant to be overridden.
	 */
	protected writeOutput(data: O): void {
		writeOutputPrivate(data, this.outputOptions, this.buildTableOutput.bind(this))
	}
}

/**
 * The "Listing" mixin is used to add the ability to present a list of resources
 * in an indexed table format to the user. The index can be used by the user
 * to specify later which one they want to act on (more about that below).
 *
 * Most basically, this is used for top level commands that list resources like
 * "locations" which lists all the locations. These commands also support
 * getting (potentially more detailed info) about a specific resource using the
 * index.
 *
 * Note that if you are going to take an action on the resource rather than just
 * displaying it, you should use one of the "Selecting" functions instead.
 * See io modules for more information.
 *
 * By default (not counting the index), the table output only includes the
 * fields defined by sortKeyName and primaryKeyName but more fields can
 * be included by defining listTableFieldDefinitions.
 *
 * NOTE: this mixin requires that Outputable also be mixed in.
 */
export abstract class Listing<L> extends Outputable {
	abstract readonly primaryKeyName: string
	abstract readonly sortKeyName: string

	protected listTableFieldDefinitions?: TableFieldDefinition<L>[]

	protected buildListTableOutput(sortedList: L[]): string {
		const definitions: TableFieldDefinition<L>[] = this.listTableFieldDefinitions ?? [
			this.sortKeyName,
			this.primaryKeyName,
		]
		let count = 0
		definitions.unshift({
			label: '#',
			value: () => (++count).toString(),
		})
		return this.tableGenerator.buildTableFromList(sortedList, definitions)
	}
	protected writeListOutput(data: L[]): void {
		writeOutputPrivate(data, this.outputOptions, this.buildListTableOutput.bind(this))
	}

	protected sort(list: L[]): L[] {
		return list.sort((a, b) => {
			// @ts-ignore
			const av = a[this.sortKeyName].toLowerCase()
			// @ts-ignore
			const bv = b[this.sortKeyName].toLowerCase()
			return av === bv ? 0 : av < bv ? -1 : 1
		})
	}
}

/**
 * Extend this class for your command if you need to accept input but the
 * API call you're making doesn't have complex output. There are currently
 * no examples of this in the CLI (as of August 2020).
 */
export abstract class InputAPICommand<I> extends APICommand {
	/**
	 * This is just a convenience method that outputs a simple string message
	 * on success and handles exceptions. This is mostly useful for simple
	 * things like a DELETE call that don't have any complicated inputs or
	 * outputs.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(successMessage: string, executeCommand: (data: I) => Promise<void>): void {
		this.readInput().then(input => {
			return executeCommand(input)
		}).then(() => {
			process.stdout.write(`${successMessage}\n`)
		}).catch(err => {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		})
	}
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InputAPICommand<I> extends Inputting<I> {}
applyMixins(InputAPICommand, [Inputting], { mergeFunctions: true })

/**
 * Extend this class if your command has complex output but doesn't take
 * complex input and doesn't need to list multiple resources. This is a
 * relatively rare use-case.
 */
export abstract class OutputAPICommand<O> extends APICommand {
	/**
	 * This is just a convenience method that outputs the data and handles
	 * exceptions.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(getData: GetCallback<O>): void {
		getData().then(data => {
			this.writeOutput(data)
		}).catch(err => {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		})
	}

	static flags = outputFlags
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OutputAPICommand<O> extends Outputting<O> {}
applyMixins(OutputAPICommand, [Outputable, Outputting], { mergeFunctions: true })

/**
 * An API command that has complex input and complex output. This
 * would normally be used for POST and PUT methods (though in the case of PUT
 * one of the "Selecting" classes that extend this is more often appropriate).
 *
 * Generic types:
 *   I: the input type
 *   O: the output type
 */
export abstract class InputOutputAPICommand<I, O> extends APICommand {
	/**
	 * This is just a convenience method that reads the input, calls the given
	 * function to act on it and then displays the results to the user.
	 *
	 * @param executeCommand function that does the work
	 */
	// TODO: update signature to use a type from above?
	protected processNormally(executeCommand: (input: I) => Promise<O>): void {
		if (this.flags['dry-run']) {
			this.readInput().then(input => {
				writeOutputPrivate(input, this.outputOptions)
			}).catch(err => {
				this.logger.error(`caught error ${err}`)
				process.exit(1)
			})
		} else {
			this.readInput().then(input => {
				return executeCommand(input)
			}).then(saved => {
				this.writeOutput(saved)
			}).catch(err => {
				this.logger.error(`caught error ${err}`)
				process.exit(1)
			})
		}
	}

	static flags = {
		...inputOutputFlags,
		'dry-run': flags.boolean({
			char: 'd',
			description: "produce JSON but don't actually submit",
		}),
	}
}

export interface InputOutputAPICommand<I, O> extends Inputting<I>, Outputting<O> {}
applyMixins(InputOutputAPICommand, [Inputting, Outputable, Outputting], { mergeFunctions: true })

async function oldStringTranslateToId<L>(this: APICommand & { readonly primaryKeyName: string; sort(list: L[]): L[] },
		idOrIndex: string,
		listFunction: ListCallback<L>): Promise<string> {

	if (!isIndexArgument(idOrIndex)) {
		// idOrIndex isn't a valid index so has to be an id (or bad)
		return idOrIndex
	}

	const index = Number.parseInt(idOrIndex)

	const items = this.sort(await listFunction())
	const matchingItem: L = items[index - 1]
	if (!(this.primaryKeyName in matchingItem)) {
		throw Error(`did not find key ${this.primaryKeyName} in data`)
	}
	// @ts-ignore
	const pk = matchingItem[this.primaryKeyName]
	if (typeof pk === 'string') {
		return pk
	}

	throw Error(`invalid type ${typeof pk} for primary key`  +
		` ${this.primaryKeyName} in ${JSON.stringify(matchingItem)}`)
}

export async function stringTranslateToNestedId<ID, NL>(this: APICommand & { readonly nestedPrimaryKeyName: string; nestedSort(list: NL[]): NL[] },
		id: ID,
		nestedIdOrIndex: string,
		listFunction: NestedListCallback<ID, NL>): Promise<string> {

	let nestedPk = nestedIdOrIndex
	if (isIndexArgument(nestedIdOrIndex)) {
		const index = Number.parseInt(nestedIdOrIndex)
		const items = this.nestedSort(await listFunction(id))
		const matchingItem: NL = items[index - 1]
		if (!(this.nestedPrimaryKeyName in matchingItem)) {
			throw Error(`did not find key ${this.nestedPrimaryKeyName} in data ${JSON.stringify(items)}`)
		}

		nestedPk = (matchingItem as unknown as { [name: string]: string })[this.nestedPrimaryKeyName]
	}
	return nestedPk
}


async function oldStringGetIdFromUser<L>(this: APICommand & { readonly primaryKeyName: string }, items: L[]): Promise<string> {
	const convertToId = (itemIdOrIndex: string): string | false => {
		if (itemIdOrIndex.length === 0) {
			return false
		}
		const matchingItem = items.find((item) => {
			// @ts-ignore
			return (this.primaryKeyName in item) && itemIdOrIndex === item[this.primaryKeyName]
		})
		if (matchingItem) {
			return itemIdOrIndex
		}

		if (!isIndexArgument(itemIdOrIndex)) {
			return false
		}

		const index = Number.parseInt(itemIdOrIndex)

		if (!Number.isNaN(index) && index > 0 && index <= items.length) {
			// @ts-ignore
			const pk = items[index - 1][this.primaryKeyName]
			if (typeof pk === 'string') {
				return pk
			} else {
				throw Error(`invalid type ${typeof pk} for primary key`  +
					` ${this.primaryKeyName} in ${JSON.stringify(items[index - 1])}`)
			}
		} else {
			return false
		}
	}

	const itemIdOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'itemIdOrIndex',
		message: 'Enter id or index',
		validate: (input) => {
			return convertToId(input)
				? true
				: `Invalid id or index ${itemIdOrIndex}. Please enter an index or valid id.`
		},
	})).itemIdOrIndex
	const inputId = convertToId(itemIdOrIndex)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}
	return inputId
}

export async function stringGetNestedIdFromUser<NL>(this: APICommand & { readonly nestedPrimaryKeyName: string }, items: NL[]): Promise<string> {
	const convertToId = (itemIdOrIndex: string): string | false => {
		if (itemIdOrIndex.length === 0) {
			return false
		}
		const matchingItem = items.find((item) => {
			// @ts-ignore
			return (this.nestedPrimaryKeyName in item) && itemIdOrIndex === item[this.nestedPrimaryKeyName]
		})
		if (matchingItem) {
			return itemIdOrIndex
		}

		if (!isIndexArgument(itemIdOrIndex)) {
			return false
		}

		const index = Number.parseInt(itemIdOrIndex)

		if (!Number.isNaN(index) && index > 0 && index <= items.length) {
			// @ts-ignore
			const pk = items[index - 1][this.nestedPrimaryKeyName]
			if (typeof pk === 'string') {
				return pk
			} else {
				throw Error(`invalid type ${typeof pk} for primary key`  +
					` ${this.nestedPrimaryKeyName} in ${JSON.stringify(items[index - 1])}`)
			}
		} else {
			return false
		}
	}

	const itemIdOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'itemIdOrIndex',
		message: 'Enter id or index',
		validate: (input) => {
			return convertToId(input)
				? true
				: `Invalid id or index ${itemIdOrIndex}. Please enter an index or valid id.`
		},
	})).itemIdOrIndex
	const inputId = convertToId(itemIdOrIndex)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}
	return inputId
}

export abstract class SelectingInputOutputAPICommandBase<ID, I, O, L> extends APICommand {
	private _entityId?: ID
	protected abstract getIdFromUser(items: L[]): Promise<ID>

	protected translateToId?(idOrIndex: ID | string, listFunction: ListCallback<L>): Promise<ID>

	protected acceptIndexId = false

	protected get entityId(): ID {
		if (!this._entityId) {
			throw new Error('Entity ID not set')
		}
		return this._entityId
	}

	protected async processNormally(idOrIndex: ID | string | undefined,
			listCallback: ListCallback<L>,
			updateCallback: UpdateCallback<ID, I, O>): Promise<void> {
		try {
			if (idOrIndex) {
				if (this.acceptIndexId) {
					if (!this.translateToId) {
						throw new Error('translateToId must be defined if acceptIndexId is true')
					}
					this._entityId = await this.translateToId(idOrIndex, listCallback)
				} else if (typeof idOrIndex === 'string' && isIndexArgument(idOrIndex)) {
					throw new Error('List index references not supported for this command. Specify'
						+ ' id instead or omit argument and select from list')
				} else {
					// @ts-ignore
					this._entityId = idOrIndex
				}
			} else if (this.inputOptions.filename || process.stdin.isTTY) {
				const items = this.sort(await listCallback())
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				writeOutputPrivate(items, this.outputOptions, this.buildListTableOutput.bind(this), true)
				this._entityId = await this.getIdFromUser(items)
			} else {
				throw Error('When input data comes in via stdin, id is required on command line')
			}
			const input: I = await this.readInput()
			const output = await updateCallback(this.entityId, input)
			this.writeOutput(output)
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = inputOutputFlags
}

/**
 * Use this class when you have both complex input and output and are acting
 * on a single resource that can easily be listed. The most common use
 * case for this is an "update" command (which normally uses a PUT). Using
 * this class gives you all the abilities of "Selecting", "Input" and "Output"
 * classes.
 *
 * NOTE: this class takes an identifier type as a generic argument. In most
 * cases, you have a simple string for an identifier and can use
 * SelectingInputOutputAPICommand instead.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SelectingInputOutputAPICommandBase<ID, I, O, L> extends Inputting<I>, Outputting<O>, Listing<L> {}
applyMixins(SelectingInputOutputAPICommandBase, [Inputting, Outputable, Outputting, Listing], { mergeFunctions: true })

/**
 * A slightly easier-to-use version of SelectingInputOutputAPICommandBase for
 * the common case of resources that use simple strings for identifiers.
 */
export abstract class SelectingInputOutputAPICommand<I, O, L> extends SelectingInputOutputAPICommandBase<string, I, O, L> {
	protected getIdFromUser = oldStringGetIdFromUser
	protected translateToId = oldStringTranslateToId
}

/**
 * Use this class when you have complex output and are acting on a single
 * resource that can easily be listed. This isn't really common but does pop up
 * from time to time in our API.
 *
 * NOTE: this class takes an identifier type as a generic argument. In most
 * cases, you have a simple string for an identifier and can use
 * SelectingOutputAPICommand instead.
 */
export abstract class SelectingOutputAPICommandBase<ID, O, L> extends APICommand {
	protected abstract getIdFromUser(items: L[]): Promise<ID>

	protected translateToId?(idOrIndex: ID | string, listFunction: ListCallback<L>): Promise<ID>

	protected acceptIndexId = false

	private _entityId?: ID
	protected get entityId(): ID {
		if (!this._entityId) {
			throw new Error('Entity ID not set')
		}
		return this._entityId
	}

	protected async processNormally(idOrIndex: ID | string | undefined,
			listCallback: ListCallback<L>,
			actionCallback: LookupCallback<ID, O>): Promise<void> {
		try {
			if (idOrIndex) {
				if (this.acceptIndexId) {
					if (!this.translateToId) {
						throw new Error('translateToId must be defined if acceptIndexId is true')
					}
					this._entityId = await this.translateToId(idOrIndex, listCallback)
				} else if (typeof idOrIndex === 'string' && isIndexArgument(idOrIndex)) {
					throw new Error('List index references not supported for this command. Specify'
						+ ' id instead or omit argument and select from list')
				} else {
					// @ts-ignore
					this._entityId = idOrIndex
				}
			} else {
				const items = this.sort(await listCallback())
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				writeOutputPrivate(items, this.outputOptions, this.buildListTableOutput.bind(this), true)
				this._entityId = await this.getIdFromUser(items)
			}
			const output = await actionCallback(this.entityId)
			this.writeOutput(output)
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = outputFlags
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SelectingOutputAPICommandBase<ID, O, L> extends Outputting<O>, Listing<L> {}
applyMixins(SelectingOutputAPICommandBase, [Outputable, Outputting, Listing], { mergeFunctions: true })

/**
 * A slightly easier-to-use version of SelectingOutputAPICommandBase for the
 * common case of resources that use simple strings for identifiers.
 */
export abstract class SelectingOutputAPICommand<O, L> extends SelectingOutputAPICommandBase<string, O, L> {
	protected getIdFromUser = oldStringGetIdFromUser
	protected translateToId = oldStringTranslateToId
}


/**
 * Use this as your base when you need to be able to list or get a single
 * resource from a list originating from another resource, which itself can be listed
 *
 * This class accepts the identifier types of both the primary and secondary lists as the ID and NID generic inputs.
 * In most cases, your ids will be a simple strings and you can use NestedListingOutputAPICommand class,
 * which is a little simpler. If the first ID is not a string but the second ID is, you can use the
 * NestedListingOutputAPICommand class.
 */
export abstract class NestedListingOutputAPICommandBase<ID, NID, O, L, NL> extends APICommand {
	abstract readonly nestedPrimaryKeyName: string
	abstract readonly nestedSortKeyName: string

	protected nestedListTableFieldDefinitions?: TableFieldDefinition<NL>[]

	protected abstract translateToId(
		idOrIndex: ID | string,
		listFunction: ListCallback<L>): Promise<ID>

	protected abstract translateToNestedId(
		idOrIndex: ID | string,
		nestedIdOrIndex: NID | string,
		nestedListFunction: NestedListCallback<ID, NL>): Promise<NID>

	protected nestedSort(list: NL[]): NL[] {
		return list.sort((a, b) => {
			const av = (a as unknown as { [name: string]: string })[this.nestedSortKeyName].toLowerCase()
			const bv = (b as unknown as { [name: string]: string })[this.nestedSortKeyName].toLowerCase()
			return av === bv ? 0 : av < bv ? -1 : 1
		})
	}

	protected buildNestedListTable(sortedList: NL[]): string {
		const definitions: TableFieldDefinition<NL>[] = this.nestedListTableFieldDefinitions ?? [
			this.nestedSortKeyName,
			this.nestedPrimaryKeyName,
		]
		let count = 0
		definitions.unshift({
			label: '#',
			value: () => (++count).toString(),
		})
		return this.tableGenerator.buildTableFromList(sortedList, definitions)
	}

	protected async processNormally(
			idOrIndex: ID | string | undefined,
			nestedIdOrIndex: string | undefined,
			listFunction: ListCallback<L>,
			nestedListFunction: NestedListCallback<ID, NL>,
			getFunction: NestedGetCallback<ID, NID, O>): Promise<void> {

		try {
			if (idOrIndex) {
				const id: ID = await this.translateToId(idOrIndex, listFunction)
				if (nestedIdOrIndex) {
					const nestedId: NID = await this.translateToNestedId(id, nestedIdOrIndex, nestedListFunction)
					const item = await getFunction(id, nestedId)
					this.writeOutput(item)
				} else {
					const list = this.nestedSort(await nestedListFunction(id))
					writeOutputPrivate(list, this.outputOptions, this.buildNestedListTable.bind(this))
				}

			} else {
				const list = this.sort(await listFunction())
				writeOutputPrivate(list, this.outputOptions, this.buildListTableOutput.bind(this))
			}
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = outputFlags
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface NestedListingOutputAPICommandBase<ID, NID, O, L, NL> extends Outputting<O>, Listing<L> {}
applyMixins(NestedListingOutputAPICommandBase, [Outputable, Outputting, Listing], { mergeFunctions: true })

/**
 * Use this as your base when you need to be able to list or get a single
 * resource from a list that is itself a property of another listable resource.
 *
 * This class is used for commands where both identifiers are simple strings.
 * If you need more complex identifier types, use the NestedListingOutputAPICommandBase class.
 */
export abstract class NestedListingOutputAPICommand<O, L, NL> extends NestedListingOutputAPICommandBase<string, string, O, L, NL> {
	protected translateToId = oldStringTranslateToId
	protected translateToNestedId = stringTranslateToNestedId
	static flags = NestedListingOutputAPICommandBase.flags
}

/**
 * This class is used for command like "delete" that act on a resource from a list
 * property on another listable resource.
 *
 * APIs that use a simple string identifier for both listable resource can use
 * NestedSelectingAPICommand while those whose second ID is a string but first is
 * not can use NestedSelectingAPICommand
 */
export abstract class NestedSelectingAPICommandBase<ID, NID, L, NL> extends APICommand {
	protected abstract getIdFromUser(items: L[]): Promise<ID>
	protected abstract getNestedIdFromUser(items: NL[]): Promise<NID>
	abstract readonly nestedPrimaryKeyName: string
	abstract readonly nestedSortKeyName: string

	private _entityId?: ID
	protected get entityId(): ID {
		if (!this._entityId) {
			throw new Error('Entity ID not set')
		}
		return this._entityId
	}

	private _nestedEntityId?: NID
	protected get nestedEntityId(): NID {
		if (!this._nestedEntityId) {
			throw new Error('Entity NID not set')
		}
		return this._nestedEntityId
	}

	protected nestedSort(list: NL[]): NL[] {
		return list.sort((a, b) => {
			const av = (a as unknown as { [name: string]: string })[this.nestedSortKeyName].toLowerCase()
			const bv = (b as unknown as { [name: string]: string })[this.nestedSortKeyName].toLowerCase()
			return av === bv ? 0 : av < bv ? -1 : 1
		})
	}

	protected nestedListTableFieldDefinitions?: TableFieldDefinition<NL>[]

	protected buildNestedListTable(sortedList: NL[]): string {
		const definitions: TableFieldDefinition<NL>[] = this.nestedListTableFieldDefinitions ?? [
			this.nestedSortKeyName,
			this.nestedPrimaryKeyName,
		]
		let count = 0
		definitions.unshift({
			label: '#',
			value: () => (++count).toString(),
		})
		return this.tableGenerator.buildTableFromList(sortedList, definitions)
	}

	protected writeNestedListOutput(data: NL[]): void {
		writeOutputPrivate(data, this.outputOptions, this.buildNestedListTable.bind(this))
	}

	protected async processNormally(
			id: ID | undefined,
			nestedId: NID | undefined,
			listCallback: ListCallback<L>,
			nestedListCallback: NestedListCallback<ID, NL>,
			actionCallback: NestedActionCallback<ID, NID>,
			successMessage?: string): Promise<void> {
		try {
			if (id) {
				if (typeof id !== 'string' || !isIndexArgument(id)) {
					this._entityId = id
				} else {
					throw new Error('List index references not supported for this command. Specify id instead or omit argument and select from list')
				}
			} else {
				const items = this.sort(await listCallback())
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				this.writeListOutput(items)
				this._entityId = await this.getIdFromUser(items)
			}

			if (nestedId) {
				if (typeof nestedId !== 'string' || !isIndexArgument(nestedId)) {
					this._nestedEntityId = nestedId
				} else {
					throw new Error('List index references not supported for this command. Specify id instead or omit argument and select from list')
				}
			} else {
				const items = this.nestedSort(await nestedListCallback(this.entityId))
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				this.writeNestedListOutput(items)
				this._nestedEntityId = await this.getNestedIdFromUser(items)
			}

			await actionCallback(this.entityId, this.nestedEntityId)
			if (successMessage) {
				this.log(successMessage
					.replace('{{id}}', JSON.stringify(this._entityId))
					.replace('{{nestedId}}', JSON.stringify(this._nestedEntityId)))
			}
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = APICommand.flags
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface NestedSelectingAPICommandBase<ID, NID, L, NL> extends Outputable, Listing<L> {}
applyMixins(NestedSelectingAPICommandBase, [Outputable, Listing], { mergeFunctions: true })

/**
 * A version of NestedSelectingAPICommandBase for APIs that use strings for the IDs of the items
 * in the first and second lists
 */
export abstract class NestedSelectingAPICommand<L, NL> extends NestedSelectingAPICommandBase<string, string, L, NL> {
	protected getIdFromUser = oldStringGetIdFromUser
	protected getNestedIdFromUser = stringGetNestedIdFromUser
}

/* eslint-enable no-process-exit */
/* eslint-enable @typescript-eslint/ban-ts-comment */
