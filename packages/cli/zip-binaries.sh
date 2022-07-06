#!/bin/bash

# TODO replace with portable script

function zip_binary() {
	os=$1
	ext=$2
	(
		cd dist_bin
		mkdir -p assets
		mv "cli-$os$ext" "smartthings$ext"
		if [[ "$os" == "macos" ]]; then
			tar -czf assets/smartthings-$os.tar.gz "smartthings$ext"
		fi
		zip assets/smartthings-$os.zip "smartthings$ext"
		mkdir -p $os
		mv "smartthings$ext" "$os"
	)
}

# zip package output binaries for uploading to github releases
zip_binary linux
zip_binary macos
zip_binary win .exe
