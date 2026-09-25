#!/usr/bin/env python3
"""Stop the headless Foundry server started by run_foundry_headless.py, and confirm it's down.

For when you're not attached to the terminal running run_foundry_headless.py (it's in another
window, was backgrounded, or you lost the window) -- if you are attached, Ctrl+C there does the
same graceful-then-forced stop with the same verification, since both scripts share the exact
same stop_server_process() from run_foundry_headless.py.

Reads the PID that run_foundry_headless.py wrote to tools/.foundry-headless.pid and stops it:
asks it to close gracefully first (so Foundry gets a chance to close its databases cleanly
instead of being cut off mid-write), force-kills it if that doesn't work within a few seconds,
then verifies the shutdown two independent ways instead of trusting the kill command's exit
code alone -- polls `tasklist` until the PID is gone, and opens a TCP connection to the port to
confirm nothing answers.

This script only stops a server it (or run_foundry_headless.py) knows about via the PID file --
it will not touch the Foundry Virtual Tabletop desktop app or any other unrelated process. If
the PID file is missing but something is still listening on the target port anyway, it warns
about that instead of guessing what to kill.

Usage:
    py tools/stop_foundry_headless.py
    py tools/stop_foundry_headless.py --port 30000
"""
import argparse
import sys
import time

from run_foundry_headless import DEFAULT_PORT, LOCK_RELEASE_BUFFER_SECONDS, PID_FILE, is_node_process, port_is_open, stop_server_process


def main():
    sys.stdout.reconfigure(line_buffering=True)  # keep log order trustworthy when redirected/piped

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--port", type=int, default=DEFAULT_PORT,
        help=f"port to verify is no longer listening after shutdown (default: {DEFAULT_PORT})",
    )
    args = parser.parse_args()

    if not PID_FILE.exists():
        print(f"stop: no PID file at {PID_FILE} -- nothing to stop.")
        if port_is_open(args.port):
            sys.exit(
                f"warning: nothing tracked in the PID file, but something is still listening on "
                f"port {args.port} (the Foundry desktop app? a server started outside this "
                f"script, or from another repo's copy of it?). Not touching it -- close it "
                f"yourself if that's unexpected."
            )
        return

    pid = PID_FILE.read_text().strip()
    if not pid or not pid.isdigit():
        print(f"stop: PID file at {PID_FILE} is empty/invalid -- removing it.")
        PID_FILE.unlink(missing_ok=True)
        return

    if not is_node_process(pid):
        print(f"stop: PID {pid} from the PID file isn't running anymore -- cleaning up the PID file.")
        PID_FILE.unlink(missing_ok=True)
        return

    print(f"stop: stopping headless Foundry server (PID {pid}) -- giving it a moment to shut down gracefully ...")
    process_gone, port_closed = stop_server_process(pid, args.port)
    PID_FILE.unlink(missing_ok=True)

    if process_gone and port_closed:
        print(f"stop: confirmed -- PID {pid} is gone and port {args.port} is no longer accepting connections.")
        # The PID file is gone now, so a following run_foundry_headless.py won't know to wait out
        # Foundry's lock-file staleness window itself -- do it here so an immediate restart is safe.
        print(f"stop: waiting {LOCK_RELEASE_BUFFER_SECONDS}s for Foundry's data-directory lock to clear ...")
        time.sleep(LOCK_RELEASE_BUFFER_SECONDS)
        return

    if not process_gone:
        print(f"warning: PID {pid} still shows up in tasklist after stopping.")
    if not port_closed:
        print(f"warning: port {args.port} is still accepting connections after stopping PID {pid}.")
    sys.exit("error: could not fully verify shutdown -- see warnings above.")


if __name__ == "__main__":
    main()
