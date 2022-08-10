from pexpect.popen_spawn import PopenSpawn


def test_help_output():
    process = PopenSpawn('smartthings --help')

    # expect at least some critical commands present in the TOPICS output
    # failures here could signal an issue in the build process
    process.expect('deviceprofiles')
    process.expect('devices')
    process.expect('edge')
    process.expect('locations')
