#!/bin/bash

# Currently using lerna publish locally with interactive confirmation until we are confident
# enough to add to CI/CD.
#
# Requirements to run:
# 1. lerna installed
# 2. smartthingspi Github PAT environment variable set "export GH_TOKEN=pi-token-here"
# 3. npm login as smartthingspi
# 4. local master is up to date with upstream and no changes have been committed on top
#
# All configuration not shown in commands here is set in lerna.json under "command.publish".
# "command.publish.conventionalPrerelease" and "command.publish.preid" should be removed once
# we are out of pre-release. Further one-time lerna commands will be needed to "graduate" packages out
# of pre.
#
# See https://github.com/lerna/lerna/blob/f6e7a13e60fefc523d701efddfcf0ed41a77749b/commands/version/README.md#prerelease

set -e

export GIT_AUTHOR_NAME=smartthingspi
export GIT_AUTHOR_EMAIL=pi-team@smartthings.com
export GIT_COMMITTER_NAME=smartthingspi
export GIT_COMMITTER_EMAIL=pi-team@smartthings.com

if [ -z $GH_TOKEN ]; then
    echo "ERROR: lerna requires GH_TOKEN environment variable to be set to create Github release."
    exit 1
fi

# verify npm auth and ping just in case to prevent commiting everything and then failing
npm whoami
npm ping

# full clean
rm -rf node_modules packages/*/node_modules
rm -f node_modules packages/*/tsconfig.tsbuildinfo
rm -rf packages/*/dist
rm -rf packages/*/dist_bin

# bootstrap
lerna bootstrap
lerna run clean
lerna run compile

# build binaries
lerna run package

# zip package output binaries for uploading (manually for now) to github releases
zip packages/cli/dist_bin/smartthings-linux.zip packages/cli/dist_bin/cli-linux
zip packages/cli/dist_bin/smartthings-macos.zip packages/cli/dist_bin/cli-macos
zip packages/cli/dist_bin/smartthings-win.zip packages/cli/dist_bin/cli-win.exe

# ignoring lifecycle scripts for now due to an error running oclif-dev inside the lerna version and publish commands.
# the "version" npm-scripts all work outside of those commands by running "lerna run version"
lerna publish --ignore-scripts
