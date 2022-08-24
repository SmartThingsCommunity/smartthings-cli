from pexpect.popen_spawn import PopenSpawn


def test_edge_plugin_is_installed_and_callable():
    process = PopenSpawn('smartthings edge --help')

    exit_status = process.wait()

    assert exit_status == 0

    process.expect('edge:channels')
    process.expect('edge:drivers')
