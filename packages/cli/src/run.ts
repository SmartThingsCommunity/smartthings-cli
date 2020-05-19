// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-var-requires */
require('@oclif/command').run()
	.then(require('@oclif/command/flush'))
	.catch(require('@oclif/errors/handle'))
