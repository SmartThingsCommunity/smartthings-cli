## SmartThings CLI Windows Installer

### WiX Toolset

We use a "simple" [WiX Toolset](https://wixtoolset.org/) v3 configuration. The majority of the .wxs file was written with these examples as reference <https://github.com/kurtanr/WiXInstallerExamples>. Comments try to point to references for info that is not immediately intuitive.

### smartthings.wxs

This is the WiX source file that needs to be "compiled" to a `.wixobj` and then finally linked into an `.msi`. The steps and expectations for this process are below.

#### Environment Variables

The WiX file includes some build variables that can be passed by setting specific env vars in the shell that runs the tasks.

1. `SMARTTHINGS_SEMVER`: Sets the version that shows in Windows Programs and Features. This should not include the fourth section of the Windows format, as we ignore this and leave 0. Pre-release labels are not supported.

1. `SMARTTHINGS_BINARY_PATH`: Specifies the location of the executable that we want to install. This will need to be accessible during the linking step below, so needs to be relative path to the `.wxs` file or an absolute system path.

#### License

The End User License Agreement step of the installer requires an `.rtf` file specified in the WiX markup. The current setup assumes this is in the same directory as the `.wxs` file.

#### Usage

The following assumes running under Windows OS with the WiX Toolset installed and on the system Path. GitHub hosted runners have the v3 tools installed by default as of writing. These tasks are ran in the same directory as required files.

> :warning: Ensure the required Environment Variables are set.

Compile WiX Source

```console
candle.exe smartthings.wxs -ext WixUIExtension
```

Build .msi Installer

```console
light.exe -out smartthings.msi smartthings.wixobj -ext WixUIExtension
```
