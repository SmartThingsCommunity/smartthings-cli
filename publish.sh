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
# All configuration not shown in commands here is set in lerna.json under "command.publish" or release-it.yaml.
# Once we are out of pre-release, if we are still using release-it to update releases with binaries, we'll need
# to set "preRelease: false". If we are still using lerna, "command.publish.conventionalPrerelease" and
# "command.publish.preid" should be removed. Further one-time lerna commands will be needed to "graduate" packages out of pre.
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
rm -rf packages/*/dist packages/cli/lib
rm -rf packages/*/dist_bin

# bootstrap
lerna bootstrap
lerna run clean
lerna run compile
lerna run test

# build binaries (duplicated as a test first before versioning/publishing)
lerna run package

# ignoring lifecycle scripts for now due to an error running oclif-dev inside the lerna version and publish commands.
# the "version" npm-scripts all work outside of those commands by running "lerna run version"
lerna publish --ignore-scripts

# repeat after lerna bumped and committed versioned files
lerna run compile
lerna run package

function zip_binary() {
	os=$1
	ext=$2
	(
		cd packages/cli/dist_bin
		mv "cli-$os$ext" "smartthings$ext"
		zip ../../../smartthings-$os.zip "smartthings$ext"
		mv "smartthings$ext" "cli-$os$ext"
	)
}

# zip package output binaries for uploading to github releases
zip_binary linux
zip_binary macos
zip_binary win .exe

# update github release with zipped binaries (bulk of config in .release-it.yaml)
# required due to lerna not supporting assets https://github.com/lerna/lerna/issues/2743
npx release-it -VV --no-increment --no-npm --ci
