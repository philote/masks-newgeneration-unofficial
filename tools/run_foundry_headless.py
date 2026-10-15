#!/usr/bin/env python3
"""Refresh local dev links and (re)start Foundry VTT headless, with local changes included.

Run this any time -- as first-time setup, or to pick up new edits and restart the server.
It is meant to be the only thing you have to run: every known way this dev setup can silently
half-deploy is checked and repaired here, so "it works after running this" should always hold.
Each run:
  1. Stops any headless server this script previously started (tracked via a PID file). This
     happens first, not last: besides freeing the port, a running Foundry holds the compendium
     LevelDBs open, and step 4 cannot write a pack that's locked. The lock-release buffer this
     needs before the *next* server may start is tracked as a deadline, not slept off here, so
     it overlaps steps 2-6 instead of adding to them.
  2. Verifies (and repairs) the junctions from Data/modules/masks-newgeneration-unofficial into
     this repo, adding one for any new top-level folder the manifest started referencing. See
     refresh_masks_links() for why this can't be assumed to be already correct.
  3. Re-copies this module's module.json/LICENSE/README.md over the deployed copy (module.json
     isn't junction-linked, so a manifest edit here needs to be re-copied there before Foundry
     will see it -- the same job as `npm run sync-manifest`).
  4. Runs these three builds concurrently (they write disjoint outputs), each one's output
     printed as a single block when it finishes:
       - src/packs/ JSON -> the LevelDB packs/ Foundry actually reads (`npm run pullJSONtoLDB`),
         so compendium edits aren't silently a release behind. Skip with --skip-packs.
       - src/scss -> css/ (`npm run build`), so stylesheet edits aren't a build behind.
         Skip with --skip-css.
       - `npm run build` in the pbta checkout, so dist/ reflects whatever's on disk right now,
         even if no `gulp watch` is running. Skip with --skip-pbta-build.
  5. Pre-flights the deployed manifest: every file module.json references must exist at its
     deployed path. This is exactly what Foundry's own package loader validates, and failing
     it makes Foundry reject the module outright -- see preflight_manifest().
  6. Verifies (and repairs) the junctions from Data/systems/pbta's subfolders to the pbta
     checkout's dist/ output, and re-copies its system.json/template.json. This runs after the
     pbta build because that build's `clean` step deletes and regenerates both files.
  7. Waits out whatever is left of step 1's lock-release buffer, then starts `node main.js`
     from the installed Foundry app against the existing Data/Config
     (already licensed on this machine -- nothing to re-license), streaming its output here.
     With no --world given, it lands on Foundry's setup/world-selection screen, same as a
     fresh launch of the desktop app would; pass --world to skip straight into one. The moment
     it logs "Server started", this prints its URL as a clickable terminal hyperlink (OSC 8 --
     supported by Windows Terminal, VS Code's integrated terminal, and most modern terminal
     emulators; renders as plain text elsewhere).

Ctrl+C in this window stops the server: it gives Foundry up to GRACE_SECONDS to shut down on
its own (Windows delivers Ctrl+C to the node.exe child directly too, since it shares this
console -- Foundry gets a real chance to close its databases cleanly), force-kills it if that
doesn't happen, and then verifies -- polling until the process is gone from `tasklist` *and*
the port stops accepting connections -- before printing a final confirmed/not-confirmed result.
It does not just fire a kill and assume it worked.

This script only stops servers it started itself (tracked via the PID file below) -- it does
NOT detect or close the Foundry Virtual Tabletop desktop app, nor a server started from another
repo's copy of this script (e.g. armor-astir-foundry keeps its own PID file). If either is
running, close it first; it and this script can't both bind the same port.

If you're not attached to this window (it's running in another terminal, was backgrounded, or
you lost the window), use the companion tools/stop_foundry_headless.py instead -- it reads the
same PID file and runs the identical graceful-then-forced stop_server_process() used here.

The paths below are hardcoded for Charlie's machine (this repo checkout, the pbta checkout,
and the installed Foundry app/Data directory all live at fixed locations here) -- update them
if running this on a different machine.

Usage:
    py tools/run_foundry_headless.py                          # lands on the setup screen
    py tools/run_foundry_headless.py --world suit-up --port 30000
"""
import argparse
import concurrent.futures
import json
import os
import shutil
import socket
import stat
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PID_FILE = REPO_ROOT / "tools" / ".foundry-headless.pid"

FOUNDRY_APP = Path(r"C:\Program Files\Foundry Virtual Tabletop\resources\app")
FOUNDRY_USER_DATA = Path(r"C:\Users\Charlie\AppData\Local\FoundryVTT")
DATA_DIR = FOUNDRY_USER_DATA / "Data"

PBTA_ROOT = Path(r"C:\Users\Charlie\code\pbta")
PBTA_DIST = PBTA_ROOT / "dist"
PBTA_DATA = DATA_DIR / "systems" / "pbta"
PBTA_LINKED_DIRS = ["module", "styles", "templates", "lang", "scripts", "assets", "json"]

MASKS_DATA = DATA_DIR / "modules" / "masks-newgeneration-unofficial"
MASKS_MANIFEST_FILES = ["module.json", "LICENSE", "README.md"]
# Folders that must always be junctioned in, whether or not module.json names them. "templates"
# and "images" are the reason this list exists rather than being derived purely from the
# manifest: .hbs files and sheet images are loaded at runtime by paths in module/, so the
# manifest never mentions them and a manifest-derived list alone would silently drop them.
MASKS_BASE_LINKED_DIRS = ["css", "module", "languages", "packs", "templates", "images"]

DEFAULT_PORT = 30000

GRACE_SECONDS = 5        # time to let a graceful close finish before forcing
FORCE_TIMEOUT_SECONDS = 5  # time to confirm a forced kill actually took effect
POLL_INTERVAL_SECONDS = 0.5
# Extra buffer after stopping a previous server, before starting a new one. This needs to be
# generous, not a token pause: Foundry's dependencies include proper-lockfile, whose default
# staleness window is 10s -- a lock left behind by a just-killed process (its owner never got
# to run its own cleanup) isn't considered reclaimable by a new process until that long has
# passed, and confirmed by testing: a 2s buffer here reliably reproduced Foundry's own "Foundry
# VTT cannot start in this directory which is already locked by another process" fatal error on
# the very next start attempt. Comfortably clear the likely 10s default instead of guessing low.
LOCK_RELEASE_BUFFER_SECONDS = 12


def manifest_referenced_paths(manifest):
    """Every file path module.json points at (styles, esmodules, pack dirs, language files)."""
    paths = list(manifest.get("styles", [])) + list(manifest.get("esmodules", []))
    paths += [pack["path"] for pack in manifest.get("packs", []) if "path" in pack]
    paths += [lang["path"] for lang in manifest.get("languages", []) if "path" in lang]
    return paths


def manifest_top_level_dirs(manifest_path):
    """Every top-level repo folder the manifest references, e.g. {"css", "module", "packs"}.

    Derived rather than hardcoded because the recurring failure in this setup is a *new* folder:
    adding one to module.json without junctioning it leaves the manifest pointing at a path that
    doesn't exist on the deployed side, which Foundry treats as a fatal metadata-validation error
    and refuses to register the module at all.
    """
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return {Path(p).parts[0] for p in manifest_referenced_paths(manifest) if Path(p).parts}


def _is_junction_to(link, target):
    """True only for a real junction (reparse point) resolving to `target`.

    Checking the reparse tag matters: Git Bash's `ln -s` silently degrades to writing a ~50-byte
    plain text file containing the target path when it can't create a real reparse point on
    Windows. That looks link-ish to `ls -la` but Foundry's Node server can't traverse it, so every
    file underneath 404s and the module goes quietly dead. A plain exists()/is_dir() check would
    pass a genuine junction and a copied-in real directory alike, and is_file() would be needed
    for the fake-symlink case -- the tag check covers all three unambiguously.
    """
    try:
        info = os.lstat(str(link))
    except OSError:
        return False
    if getattr(info, "st_reparse_tag", 0) != stat.IO_REPARSE_TAG_MOUNT_POINT:
        return False
    try:
        return Path(os.path.realpath(str(link))) == target.resolve()
    except OSError:
        return False


def refresh_masks_links():
    """Verify every junction Data/modules/masks-newgeneration-unofficial needs, repairing or creating as required.

    The module folder is a real directory holding plain copies of the manifest files plus
    junctions to this repo's folders -- a junction for the whole module folder gets skipped by
    Foundry's package scanner (Windows readdir reports it as a symlink, not a directory), so the
    module would never appear in Manage Modules at all.

    Everything here is idempotent: an already-correct junction is left untouched.
    """
    MASKS_DATA.mkdir(parents=True, exist_ok=True)
    needed = sorted(set(MASKS_BASE_LINKED_DIRS) | manifest_top_level_dirs(REPO_ROOT / "module.json"))
    created, repaired = [], []
    for name in needed:
        link, target = MASKS_DATA / name, REPO_ROOT / name
        if not target.is_dir():
            if name == "packs" or name == "css":
                # Both are gitignored/generated: they only exist after the build steps below.
                target.mkdir(parents=True, exist_ok=True)
            else:
                sys.exit(f"error: module.json references '{name}/' but {target} does not exist in the repo.")
        if _is_junction_to(link, target):
            continue
        (repaired if link.exists() else created).append(name)
        _remove_existing(link)
        subprocess.run(
            ["cmd", "/c", "mklink", "/J", str(link), str(target)],
            check=True, capture_output=True, text=True,
        )
    summary = ", ".join(filter(None, [
        f"created {created}" if created else "",
        f"repaired {repaired}" if repaired else "",
    ])) or f"all {len(needed)} already correct"
    print(f"masks: junctions -- {summary}.")


def refresh_masks_manifest():
    print("masks: refreshing module.json/LICENSE/README.md ...")
    for name in MASKS_MANIFEST_FILES:
        shutil.copyfile(REPO_ROOT / name, MASKS_DATA / name)


@dataclass
class BuildStep:
    label: str
    cmd: str
    cwd: Path
    failure_message: str


# packs/ is junctioned, so this writes straight through to the deployed side with no separate
# sync step -- but nothing compiles it automatically, so without this a compendium edit stays
# invisible until someone remembers to run it by hand.
PACKS_STEP = BuildStep(
    "masks: src/packs -> packs (pullJSONtoLDB)", "npm run pullJSONtoLDB", REPO_ROOT,
    "error: pack compilation failed.\n"
    "  By far the most likely cause is that something still has the compendium LevelDBs\n"
    "  open -- compilePack cannot write a pack Foundry is holding, and fails with a raw\n"
    "  `LEVEL_ITERATOR_NOT_OPEN` / `ModuleError` stack trace that doesn't mention locking\n"
    "  at all. This script already stops the server it started, so the usual culprit is a\n"
    "  Foundry instance it can't see: the desktop app, or a server started some other way.\n"
    "  Close that and re-run, or pass --skip-packs if src/packs/ hasn't changed.",
)
CSS_STEP = BuildStep(
    "masks: src/scss -> css (npm run build)", "npm run build", REPO_ROOT,
    "error: sass build failed -- see its output above. Fix it, or pass --skip-css.",
)
PBTA_STEP = BuildStep(
    "pbta: npm run build -> dist/", "npm run build", PBTA_ROOT,
    "error: pbta build failed -- see its output above. Fix it, or pass --skip-pbta-build.",
)


def _run_step(step):
    start = time.monotonic()
    result = subprocess.run(
        step.cmd, cwd=str(step.cwd), shell=True,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace",
    )
    return result.returncode == 0, result.stdout, time.monotonic() - start


def run_parallel_steps(steps):
    """Run every step concurrently; return the subset that failed.

    Each step's combined output is buffered and printed as one block the moment that step
    finishes, so concurrent builds never interleave line-by-line. Every step is waited on even
    after one fails, so a single run surfaces all broken builds rather than one per run.
    """
    if not steps:
        return []
    print("build: running in parallel -- " + "; ".join(step.label for step in steps))
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(steps)) as pool:
        futures = {pool.submit(_run_step, step): step for step in steps}
        for future in concurrent.futures.as_completed(futures):
            step = futures[future]
            ok, output, elapsed = future.result()
            print(f"--- {step.label} -- {'ok' if ok else 'FAILED'} ({elapsed:.1f}s) ---")
            if output.strip():
                print(output.rstrip())
            if not ok:
                failed.append(step)
    return failed


def preflight_manifest():
    """Fail fast if the deployed manifest references a file that isn't there.

    This mirrors Foundry's own package loader, which validates every referenced file before
    registering a module and rejects the whole module if one is missing -- it doesn't even show up
    in Manage Modules, and the only clue is a line in the *server's* console, not the browser's.
    The downstream symptoms (documentTypes never merged, actors failing type validation at world
    boot, esmodules never loading, so every module feature silently does nothing) look nothing
    like the actual cause, so catching it here -- before the server even starts -- turns the worst
    failure mode in this setup into a one-line message naming the exact file.
    """
    deployed = MASKS_DATA / "module.json"
    manifest = json.loads(deployed.read_text(encoding="utf-8"))
    referenced = manifest_referenced_paths(manifest)
    missing = [rel for rel in referenced if not (MASKS_DATA / rel).exists()]
    if missing:
        sys.exit(
            "error: deployed manifest references files that do not exist -- Foundry would reject "
            "the module outright (it would not even appear in Manage Modules):\n"
            + "\n".join(f"  {rel}" for rel in missing)
            + "\nFix the path in module.json, or create the missing file (or drop --skip-packs / "
              "--skip-css if it's a generated one), then re-run."
        )
    print(f"masks: manifest preflight OK -- all {len(referenced)} referenced files present.")


def _remove_existing(path):
    """Remove whatever is at `path`, without recursing through a junction into its target.

    os.rmdir() on a junction removes just the reparse point (Windows treats it as an empty
    directory entry); it only raises if the directory actually has real content, in which case
    it's a genuine copied-in directory and rmtree is the correct (safe) way to clear it. Using
    shutil.rmtree() unconditionally here would be a real hazard: on a junction it doesn't stop
    at the link, it walks into the target and deletes the target's real files.
    """
    if not path.exists():
        return
    if path.is_dir():
        try:
            os.rmdir(str(path))
        except OSError:
            shutil.rmtree(str(path))
    else:
        path.unlink()


def relink_pbta():
    relinked = []
    for name in PBTA_LINKED_DIRS:
        link = PBTA_DATA / name
        target = PBTA_DIST / name
        if _is_junction_to(link, target):
            continue
        relinked.append(name)
        _remove_existing(link)
        subprocess.run(
            ["cmd", "/c", "mklink", "/J", str(link), str(target)],
            check=True, capture_output=True, text=True,
        )
    shutil.copyfile(PBTA_DIST / "system.json", PBTA_DATA / "system.json")
    shutil.copyfile(PBTA_DIST / "template.json", PBTA_DATA / "template.json")
    summary = f"relinked {relinked}" if relinked else f"all {len(PBTA_LINKED_DIRS)} already correct"
    print(f"pbta: junctions -- {summary}; system.json/template.json re-copied.")


def is_node_process(pid):
    result = subprocess.run(
        ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
        capture_output=True, text=True,
    )
    return "node.exe" in result.stdout.lower()


def port_is_open(port, host="127.0.0.1", timeout=1.0):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def wait_until_process_gone(pid, timeout_seconds):
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if not is_node_process(pid):
            return True
        time.sleep(POLL_INTERVAL_SECONDS)
    return not is_node_process(pid)


def stop_server_process(pid, port, grace_seconds=GRACE_SECONDS):
    """Stop `pid`, graceful-then-forced, and verify. Returns (process_gone, port_closed).

    First asks Windows to close it (no /F) and gives it `grace_seconds` to exit on its own --
    Foundry can use that window to close its NeDB/LevelDB databases cleanly instead of being cut
    off mid-write. Only escalates to a forced `/F` kill if it's still alive after that. Either
    way, the caller gets back real verification (a `tasklist` check and a live port probe), not
    just "the kill command returned success."
    """
    if is_node_process(pid):
        subprocess.run(["taskkill", "/PID", str(pid), "/T"], capture_output=True, text=True)
        if not wait_until_process_gone(pid, grace_seconds):
            subprocess.run(["taskkill", "/PID", str(pid), "/F", "/T"], capture_output=True, text=True)

    process_gone = wait_until_process_gone(pid, FORCE_TIMEOUT_SECONDS)
    port_closed = not port_is_open(port)
    if not port_closed:
        # The OS can take a moment to release the socket after the process dies; one retry.
        time.sleep(1)
        port_closed = not port_is_open(port)
    return process_gone, port_closed


def stop_previous_server(port):
    """Stop the tracked server, if any. Returns the monotonic time before which a new server must
    not start (see LOCK_RELEASE_BUFFER_SECONDS), or None if nothing was stopped."""
    deadline = None
    if PID_FILE.exists():
        pid = PID_FILE.read_text().strip()
        if pid and pid.isdigit() and is_node_process(pid):
            print(f"server: stopping previous headless server (PID {pid}) ...")
            process_gone, port_closed = stop_server_process(pid, port)
            if not (process_gone and port_closed):
                print(f"warning: previous server (PID {pid}) may not have fully stopped -- "
                      f"process_gone={process_gone} port_closed={port_closed}")
            deadline = time.monotonic() + LOCK_RELEASE_BUFFER_SECONDS
    PID_FILE.unlink(missing_ok=True)
    return deadline


def lock_release_remaining(deadline):
    return 0.0 if deadline is None else max(0.0, deadline - time.monotonic())


def wait_for_lock_release(deadline):
    remaining = lock_release_remaining(deadline)
    if remaining > 0:
        print(f"server: waiting {remaining:.1f}s more for the previous server's data lock to go stale ...")
        time.sleep(remaining)


def ensure_port_free(port):
    if port_is_open(port):
        sys.exit(
            f"error: port {port} is already in use by something this script doesn't track -- "
            "the Foundry desktop app, or a headless server started from another repo (each keeps "
            "its own PID file; e.g. `py ..\\armor-astir-foundry\\tools\\stop_foundry_headless.py`). "
            "Close it and re-run, or pass a different --port."
        )


def terminal_hyperlink(url, text=None):
    """OSC 8 escape sequence: renders as a clickable hyperlink in terminals that support it
    (Windows Terminal, VS Code's integrated terminal, most modern terminal emulators) and as
    plain text otherwise -- never breaks output, just isn't clickable there."""
    return f"\033]8;;{url}\033\\{text or url}\033]8;;\033\\"


def start_server(world, port):
    cmd = [
        "node", "main.js",
        f"--dataPath={FOUNDRY_USER_DATA}",
        f"--port={port}",
    ]
    if world:
        cmd.append(f"--world={world}")
    url = f"http://localhost:{port}"
    print(f"server: starting headless Foundry -- world={world or '(none -- lands on the setup screen)'} port={port}")
    print(f"        {' '.join(cmd)}")
    # Capture the child's combined stdout+stderr instead of just inheriting the console directly,
    # so this loop can watch for Foundry's own "Server started" line and print a clickable link
    # to it the moment it's actually ready. Still re-printed line-by-line as it arrives, so the
    # live console view is otherwise unchanged.
    proc = subprocess.Popen(
        cmd, cwd=str(FOUNDRY_APP),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
    )
    PID_FILE.write_text(str(proc.pid))
    link_printed = False
    try:
        for line in proc.stdout:
            print(line, end="")
            if not link_printed and "Server started and listening on port" in line:
                print(f"server: ready -> {terminal_hyperlink(url)}")
                link_printed = True
        proc.wait()
        if proc.returncode != 0:
            PID_FILE.unlink(missing_ok=True)
            sys.exit(f"error: Foundry exited on its own with code {proc.returncode} -- see its output above.")
        return
    except KeyboardInterrupt:
        print(f"\nserver: stopping (PID {proc.pid}) -- giving it up to {GRACE_SECONDS}s to shut down gracefully ...")
        process_gone, port_closed = stop_server_process(proc.pid, port)
        if process_gone and port_closed:
            print(f"server: confirmed stopped -- PID {proc.pid} is gone and port {port} is no longer accepting connections.")
        else:
            if not process_gone:
                print(f"warning: PID {proc.pid} still shows up in tasklist after stopping.")
            if not port_closed:
                print(f"warning: port {port} is still accepting connections after stopping PID {proc.pid}.")
    finally:
        PID_FILE.unlink(missing_ok=True)


def main():
    # Python fully-buffers stdout (instead of flushing per line) whenever it isn't a real
    # terminal -- e.g. redirected to a log file, or run under another tool that captures output.
    # Without this, our own print()s can sit unflushed for the entire life of the child `node`
    # process (which inherits the fd directly and isn't subject to this buffering), making them
    # appear in the log *after* things that actually happened much later, such as "Server
    # started". Force line-buffering so the log's order matches real event order regardless.
    sys.stdout.reconfigure(line_buffering=True)

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--world", default=None,
        help="world to launch into (default: none -- lands on Foundry's setup/world-selection "
             "screen instead; pass e.g. --world suit-up to skip straight into a world)",
    )
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"port to serve on (default: {DEFAULT_PORT})")
    parser.add_argument(
        "--skip-packs", action="store_true",
        help="skip `npm run pullJSONtoLDB`. Only safe when src/packs/ hasn't changed since the "
             "last run -- the deployed compendiums are whatever was compiled last.",
    )
    parser.add_argument(
        "--skip-css", action="store_true",
        help="skip `npm run build` (sass). Only safe when src/scss/ hasn't changed since the "
             "last build, or a `npm run watch` is already keeping css/ current.",
    )
    parser.add_argument(
        "--skip-pbta-build", action="store_true",
        help="skip `npm run build` in the pbta checkout (it's the slowest step, and pointless if "
             "pbta hasn't changed or a `gulp watch` is already keeping dist/ current)",
    )
    args = parser.parse_args()

    # Stopping the old server comes first, before any deploy step -- not just because it frees the
    # port. A running Foundry holds the compendium LevelDBs open, and compilePack cannot write a
    # pack that's locked, so doing this later would make pack compilation fail on every re-run
    # (i.e. the script's whole purpose: restart to pick up changes). Its lock-release buffer is
    # returned as a deadline and only waited out right before the new server starts, so it
    # overlaps the deploy work below instead of being dead time.
    deploy_start = time.monotonic()
    lock_deadline = stop_previous_server(args.port)

    # Then: links first (everything downstream writes or reads through them), then the manifest
    # copy, then the builds, and only then the preflight -- which has to run after them so it
    # validates the state Foundry will actually see, not a half-refreshed one.
    refresh_masks_links()
    refresh_masks_manifest()

    skipped = [flag for flag, skip in [("--skip-packs", args.skip_packs), ("--skip-css", args.skip_css),
                                       ("--skip-pbta-build", args.skip_pbta_build)] if skip]
    if skipped:
        print(f"build: skipping {', '.join(skipped)}.")
    steps = [step for step, skip in [(PACKS_STEP, args.skip_packs), (CSS_STEP, args.skip_css),
                                     (PBTA_STEP, args.skip_pbta_build)] if not skip]
    failed = run_parallel_steps(steps)
    if PACKS_STEP in failed and lock_release_remaining(lock_deadline) > 0:
        # Belt-and-braces: the stopped server's LevelDB handles should already be released, but if
        # pack compilation raced them, give it the rest of the lock-release buffer and retry once.
        print("masks: pack compilation failed while the previous server's locks may still be releasing -- retrying once.")
        wait_for_lock_release(lock_deadline)
        failed.remove(PACKS_STEP)
        failed += run_parallel_steps([PACKS_STEP])
    if failed:
        sys.exit("\n\n".join(step.failure_message for step in failed))

    preflight_manifest()
    relink_pbta()
    print(f"deploy steps took {time.monotonic() - deploy_start:.1f}s.")

    wait_for_lock_release(lock_deadline)
    ensure_port_free(args.port)
    start_server(args.world, args.port)


if __name__ == "__main__":
    main()
