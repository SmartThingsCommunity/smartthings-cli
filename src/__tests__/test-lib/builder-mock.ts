import { jest } from '@jest/globals'
import { FunctionLike } from 'jest-mock'

import { Argv } from 'yargs'


/**
 * yargs builder functions work using the `Argv` interface which represents a function
 * with data. The data is mostly other functions that update the instance and return it
 * to allow chaining. This type allows us to represent a mock of the `Argv` function and
 * its property functions.
 */
export type BuilderFunctionMock<T extends FunctionLike> = jest.Mock<T> & T

/**
 * A shortcut for creating a jest mock and casting it to `BuilderFunctionMock`.
 * Using the `buildArgvMock` function will provide you with two of these. Use this
 * to create more if your `builder` function calls 2 or more other builder functions.
 */
export const buildArgvMockStub = <T extends object>(): BuilderFunctionMock<Argv<T>> =>
	jest.fn() as BuilderFunctionMock<Argv<T>>

export type ArgvMock<I extends object, O extends I> = {
	/**
	 * A simple mock of `Argv` meant to be used as the input to the last builder function
	 * in the chain.
	 *
	 * If the builder function under test does not chain any builder functions,
	 * this can be ignored.
	 *
	 * If the builder chains a single function, use this as the input to that function.
	 *
	 * If more than one builder function is chained, you can create more of these using
	 * `buildArgvMockStub`. In this case, use this for the input type to the last builder
	 * in the chain and rename it appropriately.
	 */
	yargsMock: BuilderFunctionMock<Argv<I>>

	envMock: BuilderFunctionMock<Argv<I>['env']>
	positionalMock: BuilderFunctionMock<Argv<I>['positional']>
	optionMock: BuilderFunctionMock<Argv<I>['option']>
	exampleMock: BuilderFunctionMock<Argv<I>['example']>
	epilogMock: BuilderFunctionMock<Argv<I>['epilog']>

	/**
	 * This mock is meant to be used as output of the last builder in the chain or as the
	 * input to the builder being tested if there are no chained builders.
	 *
	 * This mock includes mocks for the various builder functions we use which are returned
	 * alongside it via the above `envMock`, `positionalMock`, etc.
	 *
	 * It is also returned from all the mocked functions (e.g. `envMock`, etc.) and can be used
	 * as the expected result of the builder itself.
	 */
	argvMock: BuilderFunctionMock<Argv<O>>
}

/**
 * Most builder functions will not only call `.option` or `.positional` on the instance of `Argv`
 * passed in but also will chain one or more other builder functions. This method helps mock the
 * return values of each which are passed into the next in the chain. It also makes a final mock
 * of `Argv` (`argvMock`) which mocks several properties of `Argv` (e.g. `option`) so they can
 * be tested as well.
 *
 * For the generics to this function, `I` and `O`, specify the expected input and output types
 * for the last builder in the chain (or the expected input and output types for this builder if
 * there are no chained builders).
 *
 * For more details of this functions return value, see its return type `ArgvMock` above.
 */
export function buildArgvMock<I extends object, O = I>(): ArgvMock<I, I & O> {
	// (Note, for clarity, I'm using `{}` below rather than TypeScript's preferred `object` to
	// represent an object type with no fields defined. I feel this reads more easily.)
	//
	// The exact type of the `Argv` passed on from each call varies over the course of the builder.
	// For example, consider the following bit of builder code:
	//
	// yargs
	//     .option('output', { alias: 'o', describe: '...', type: 'string' })
	//     .option('json', { alias: 'j', describe: '...' }, type: 'boolean' )
	//
	// Using type of `{}` for `I`, the type of `O` should be `{ output?: string, json?: boolean }`.
	//
	// The type of `Argv` returned from the first call to `option` will be `Argv<{ output?: string }>`.
	// The type of `Argv` returned from the second and final call will be
	// `Argv<{ output?: string, json?: boolean }`, or `Argv<O>`. Since along the way, it varies
	// in between `Argv<I>` and `Argv<O>`, we declare `argvMock` here to be `Argv<I & Partial<O>`
	// so it can be used on these in-between mocks. Then, finally, we cast it to `Argv<O>` when we
	// return it.
	const argvMock = buildArgvMockStub<I & Partial<O>>()

	const envMock = jest.fn() as BuilderFunctionMock<Argv<I>['env']>
	envMock.mockReturnValue(argvMock)
	argvMock.env = envMock

	const positionalMock = jest.fn() as BuilderFunctionMock<Argv<I>['positional']>
	positionalMock.mockReturnValue(argvMock)
	argvMock.positional = positionalMock

	const optionMock = jest.fn() as BuilderFunctionMock<Argv<I>['option']>
	optionMock.mockReturnValue(argvMock)
	argvMock.option = optionMock

	const exampleMock = jest.fn() as BuilderFunctionMock<Argv<I>['example']>
	exampleMock.mockReturnValue(argvMock)
	argvMock.example = exampleMock

	const epilogMock = jest.fn() as BuilderFunctionMock<Argv<I>['epilog']>
	epilogMock.mockReturnValue(argvMock)
	argvMock.epilog = epilogMock

	return {
		envMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		yargsMock: buildArgvMockStub<I>(),
		argvMock: argvMock as BuilderFunctionMock<Argv<I & O>>,
	}
}
