#!/usr/bin/env python3
"""Run FoFo's official gate-runner on Windows without changing its source tree.

FoFo's runner launches sibling scripts from their Unix shebangs.  On Windows,
``/usr/bin/env python3`` is not executable even when Python itself is installed.
This adapter loads the upstream runner and changes only that process-launch
detail: each official gate is executed by the current Python interpreter.
"""

import argparse
import os
import runpy
import sys


def main():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--fofo-root', required=True)
    options, forwarded = parser.parse_known_args()
    runner = os.path.join(options.fofo_root, 'scripts', 'gate-runner')
    if not os.path.isfile(runner):
        raise SystemExit('FoFo gate-runner not found: ' + runner)

    module = runpy.run_path(runner, run_name='fofo_gate_runner')

    def windows_launch(script_path):
        with open(script_path, encoding='utf-8', errors='replace') as script:
            first_line = script.readline().lower()
        if 'node' in first_line:
            return ['node', script_path]
        return [sys.executable, script_path]

    module['main'].__globals__['launch_argv'] = windows_launch
    sys.argv = [runner] + forwarded
    module['main']()


if __name__ == '__main__':
    main()
