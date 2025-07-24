# Contributing

Thanks for contributing! Our community of developers is what put SmartThings on the map!

- [Contributing](#contributing)
	- [Development](#development)
		- [Build](#build)
		- [Changesets](#changesets)
		- [Core SDK](#core-sdk)
	- [How Can I Contribute?](#how-can-i-contribute)
		- [Improve Documentation](#improve-documentation)
		- [Give Feedback on Issues](#give-feedback-on-issues)
		- [Submitting an Issue or Feature Request](#submitting-an-issue-or-feature-request)
		- [Submitting a Pull Request](#submitting-a-pull-request)
	- [Finding Contributions to Work On](#finding-contributions-to-work-on)
	- [More About SmartThings](#more-about-smartthings)
	- [License and Copyright](#license-and-copyright)

## Development

### Build

1. Be sure you're using at least Node.js version 24.
1. run `npm install`
1. run `npm run compile`
1. To run the CLI that was just compiled, run the `run` command in bin. You can create
   a link to this file to make it easier to run. Since the final installed
   name will be "smartthings", that's a good name for the link. For example:
   `ln -s ~/mydevdir/smartthings-cli/bin/run ~/bin/smartthings`

Other useful scripts:

* run `npm run watch` to watch for changes and compile on the fly
* run `npm run build` to clean and compile
* run `npm run format` to automatically fix up lint issues if possible
* run `npm run full-clean` to start over again. This is sometimes helpful when pulling new code.

Before opening a pull request be sure to:

1. Run eslint via `npm run lint`
1. Run tests with `npm run test`
1. If you've added or or removed commands or updated any of their arguments or flags, update the readme with `npm run readme`.

### Changesets

We use changesets to automatically version and publish releases, and generate release notes. Please include one with your pull request by following the instructions to [add a changeset](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md) to a multi-package repository. We have a bot that will remind you to include one with your pull request if you forget.

### Core SDK

The CLI depends on the [SmartThings Core SDK](https://github.com/SmartThingsCommunity/smartthings-core-sdk). To use a pre-release version of the SDK for testing purposes, you'll need to make any required changes in both checked-out repositories and then [npm-link](https://docs.npmjs.com/cli/v8/commands/npm-link) the SDK into the CLI.

### Command Documentation

The SmartThings CLI is built using [yargs](http://yargs.js.org/), which allows for self-documenting
commands. Some ground rules to follow when creating or updating commands:

* Commands should be kebab case. The module name is used as the command name and can be placed in
  a topic by placing it in that topic's directory.
* Commands should always include a short one-line description that starts with a lowercase letter
  and does not end with a period. A more detailed description can be included after a newline. This
  description can be split across lines but should not include newlines (oclif will wrap it).
* Flags are also kebab case and should have a short single-character version only if they are
  expected to be used often.
  * Descriptions of flags should be short, start with a lowercase letter, and include no ending
    punctuation.
  * Flags for ids should not include an `-id` suffix.
* Names for arguments should be camel case starting with a lowercase letter.
  * Descriptions for arguments should be a short phrase without a capital letter and without ending
    punctuation.
* Examples of common tasks should be included with a description of the example.
  * Use the [object format](https://oclif.io/docs/commands#other-command-options)
    rather than the simple string format when providing examples.
  * When specifying an id in an example, use a representative example id.
  * One-line descriptions should start with a lowercase letter and not end with a period.
  * There is no need to include `$ ` prefix for command examples because oclif includes it
    automatically.

### Command Naming

Commands that map to CRUD API calls should use the following conventions:

* A primary command that allows listing or retrieving a single object. Example: `capabilities`.
  * Displays a list when no item is specified.
  * Displays a single item when an item is specified using:
    1. The id of the item.
	2. The index of the item as displayed when listing items with the same command. (This method of
	   choosing an item should not be used for commands that make changes such as `update` or `delete`.)
* A command to create an item using the POST method: Example: `capabilities:create`.
* A command to update an item using the PUT method. Example: `capabilities:update`.
* A command to delete an item using the DELETE method. Example: `capabilities:delete`.

## How Can I Contribute?

### Improve Documentation

As a user of the SmartThings CLI, you're the perfect candidate to help us improve our documentation. Error fixes, typo corrections, better explanations, more examples, etc. Open issues for things that could be improved – anything. Even improvements to this document.

### Give Feedback on Issues

We're always looking for more opinions on discussions in the issue tracker. It's a good opportunity to influence the future direction of the CLI.

### Submitting an Issue or Feature Request

- Search the issue tracker before opening an issue
- Ensure you're using the latest version
- Use a clear and descriptive title
- Include as much information as possible by filling out the issue template
- The more time you put into an issue, the more we will

### Submitting a Pull Request

- Non-trivial changes are often best discussed in an issue first, to prevent you from doing unnecessary work.
- For ambitious tasks, you should try to get your work in front of the community for feedback as soon as possible. Open a pull request as soon as you have done the minimum needed to demonstrate your idea. At this early stage, don't worry about making things perfect, or 100% complete. Describe what you still need to do and submit a [draft pull request](https://github.blog/2019-02-14-introducing-draft-pull-requests/). This lets reviewers know not to nit-pick small details or point out improvements you already know you need to make.
- Don't include unrelated changes
- New features should be accompanied with tests and documentation
- Pull requests should include only a single commit. You can use `git rebase -i main` to combine multiple commits into a single one if necessary.
- Commit messages
  - Use a clear and descriptive title for the pull request and commits
  - Commit messages must be formatted properly using [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/). Our CI will check this and fail any PRs that are formatted incorrectly.
  - This repo is [commitizen friendly](https://github.com/commitizen/cz-cli), so you can use the `cz` cli to help create your commits.
- Lint and test before submitting the pull request
  - `npm run lint`
  - `npm run test`
- Write a convincing description of why we should land your pull request. Answer _why_ it's needed and provide use-cases.
- Make the pull request from a [topic branch](https://alvinalexander.com/git/git-topic-branch-workflow-pattern-pro-git/) (not main)
- You might be asked to do changes to your pull request. There's never a need to open another pull request – [just update the existing one.](https://github.com/RichardLitt/knowledge/blob/master/github/amending-a-commit-guide.md)
- Don't forget to generate a [changeset](#changesets)

## Finding Contributions to Work On

Look at the existing issues for areas of contribution. Searching for issues labeled `help wanted` would be a great place to start.

---

## More About SmartThings

If you are not familiar with SmartThings, we have
[extensive online documentation](https://developer.smartthings.com/docs/getting-started/welcome/).

To create and manage your services and devices on SmartThings, create an account in the
[developer workspace](https://smartthings.developer.samsung.com/workspace/).

The [SmartThings Community](https://community.smartthings.com/) is a good place share and
ask questions.

There is also a [SmartThings reddit community](https://www.reddit.com/r/SmartThings/) where you
can read and share information.

## License and Copyright

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)

Copyright 2024 Samsung Electronics Co., LTD.
