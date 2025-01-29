Collected notes to eventually include in the yargs release notes.

* capability version command line arguments have been changed from (in yargs-speak) positionals to
  flags (options in yargs-speak)
* config file location is now determined by https://www.npmjs.com/package/env-paths[envPaths] library
  rather than oclif. A reasonable attempt has been made at finding the old config and copying it for
  the user. The `config` command now displays the name of the configuration file in its default output.
