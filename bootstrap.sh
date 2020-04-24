#!/bin/bash

# TODO: command line option for this:
set do_reset=n

# TODO: ask if you did the rest of the stuff from the readme

if [ "$do_reset" = "y" ]
then
	rm -rf node_modules packages/*/node_modules
	rm -rf packages/*/dist
fi

# TODO: check for global install of lerna

lerna bootstrap --hoist
npm link @smartthings/core-sdk
lerna run clean
lerna run compile
