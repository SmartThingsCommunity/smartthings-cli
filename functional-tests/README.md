# SmartThings CLI Functional Tests

## Overview

This collection of functional tests depends on a mixture of [Pexpect](https://github.com/pexpect/pexpect) and [pytest](https://github.com/pytest-dev/pytest). `pytest` is used as a framework to run the entire collection and Pexpect is used to execute the CLI and make assertions on the output.

> :warning: To keep the tests cross-platform friendly, we use Pexpect's `PopenSpawn` instead of the more heavily documented `spawn`.
> See ["Pexpect on Windows"](https://pexpect.readthedocs.io/en/stable/overview.html#pexpect-on-windows) for more details on the limitations.

## Requirements

- Python 3.x
- A built executable named `smartthings`/`smartthings.exe` installed on the system PATH environment variable.

## Usage

A good way to ensure the modules needed here don't interfere with other python projects you might
have (and vice versa) is to use a virtual python environment for running tests. You can do this
using the [venv module](https://docs.python.org/3/tutorial/venv.html).

1. `cd smartthings-cli/packages/cli/functional-tests`
2. `python -m pip install --upgrade pip`
3. `pip install -r requirements.txt`
4. `pytest`
