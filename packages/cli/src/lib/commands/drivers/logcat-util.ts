/**
 * Wait "forever" for messages or until process is interrupted.
 *
 * oclif will timeout if Node is still running for some time after
 * Command.run() resolves.
 *
 * @returns Promise that never resolves or rejects
 */
export const runForever = async (): Promise<void> => {
	return new Promise(() => undefined)
}
