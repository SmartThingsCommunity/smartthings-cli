from pexpect.popen_spawn import PopenSpawn
import sys


def test_version_output():
    process = PopenSpawn(
        'smartthings --version',
        encoding='utf-8',
        logfile=sys.stdout
    )

    process.expect('^\\d+\\.\\d+\\.\\d+')
