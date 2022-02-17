#!/bin/bash

# parse options
while [ -n "$1" ]; do
	case $1 in
	--link-sdk) DO_LINK=y ;;
	--reset) DO_RESET=y ;;
	*)
		echo "error: unknown option $1"
		exit 1
		;;
	esac
	shift
done

DO_LINK="${DO_LINK:-n}"
DO_RESET="${DO_RESET:-n}"

# TODO: ask if you did the rest of the stuff from the readme

if [ "$DO_RESET" = "y" ]; then
	rm -rf node_modules packages/*/node_modules
	rm -rf packages/*/dist packages/cli/lib
fi

# TODO: check for global install of lerna

lerna bootstrap
if [ "$DO_LINK" = "y" ]; then
	npm link @smartthings/core-sdk
fi
lerna run clean
lerna run compile
