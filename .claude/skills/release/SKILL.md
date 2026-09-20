---
name: release
description: Release a new version of the masks-newgeneration-unofficial module (e.g. "bump the patch version and release", "cut a new release", "release to Foundry") — builds CSS and runs tests, dates the CHANGELOG's Unreleased section, bumps package.json, commits and pushes, publishes a GitHub release to trigger the build workflow, waits for the release assets, then submits that release to Foundry's package listing via tools/foundry_release.py.
---

# Release a new version

This module ships through a fixed chain: a **published GitHub release** (not a bare tag) triggers
`.github/workflows/main.yml` → that workflow substitutes `module.json`'s `#{VERSION}#`/`#{URL}#`/
`#{MANIFEST}#`/`#{DOWNLOAD}#` tokens from the tag, builds `module.zip`, and attaches `module.json`
and `module.zip` to that same release → `tools/foundry_release.py` reads those assets and submits
them to Foundry's package listing. Each link only works once the previous one has finished:
`foundry_release.py` hard-fails if the release has no `module.json` asset yet, or if that asset's
version doesn't match both the tag and local `package.json`. Skipping ahead produces a failure, not a
silent no-op — but there's no reason to hit it: follow the order below.

Releases are cut from **`origin`** (`philote/masks-newgeneration-unofficial`), which is also the repo
named in `package.json`'s `homepage`/`bugs` and in `foundry_release.py`'s `DEFAULT_REPO`. The `fork`
remote (`ctincorvia/masks-newgeneration-unofficial-overhaul`) is archived and is **not** a release
target — it only exists to keep the v2.0.0–v2.1.0 release assets downloadable.

## 0. Determine the version bump

Default to a patch bump unless the user says otherwise. The current version lives in
**`package.json`**'s `"version"` field; cross-check it against the newest `v*` git tag
(`git tag --list "v*" | sort -V | tail -1`) — they should match.

`module.json`'s `"version"` is the literal string `#{VERSION}#` and **must not be edited** — the
workflow fills it from the tag. The tag is the real source of truth; `package.json` tracks it so the
release script can catch a release cut from the wrong commit.

Tags use a `v` prefix (`v2.0.4`) from v2.0.0 onward. Older tags predate that convention; don't copy
them.

## 1. Pre-flight: build and test

- `npm run build` — compiles `src/scss/*.scss` into the committed `css/`. **This is load-bearing.**
  `main.yml` zips `css/` exactly as committed and never runs sass, so an uncommitted or stale CSS
  build ships broken styling with no error at any step. Commit any resulting `css/` changes.
- `npm test` — the vitest suite.

There is no `lint` script and no pre-commit hook in this repo, so nothing runs these for you.

## 2. Update CHANGELOG.md and package.json

- `CHANGELOG.md`: rename the `#Unreleased` heading to `#X.Y.Z`, keeping its bullets as-is. Ask the
  user before adding a fresh empty `#Unreleased` above it. If there is no `#Unreleased` section, ask
  what the release notes should be rather than inventing them from the commit log.
- `package.json`: bump `"version"` to `X.Y.Z`.

Do **not** run `npm run sync-manifest` — that's only needed when `module.json` itself changes, and it
doesn't here. The exception: if the user also wants `compatibility.verified` bumped, that *is* a
`module.json` edit, and per `CLAUDE.md` §9 it requires `npm run sync-manifest` plus a full Foundry
reload to take effect locally — and per §8 it should only be bumped after a real QA pass against that
Foundry version.

## 3. Commit and push

`git add` the changed files, commit (e.g. "Release X.Y.Z"), then **confirm with the user before
pushing** — `git push origin main` is a shared-remote action, and step 4 builds on the pushed commit.

## 4. Publish the GitHub release

This is the trigger, and the point of no easy return. **Get the user's explicit go-ahead first.**

Write the new CHANGELOG section's bullets to a temp file and use it as the release body — that's the
established convention here (v2.0.4's release body is its `#2.0.4` section verbatim):

```
gh release create vX.Y.Z --title vX.Y.Z --notes-file <notes-file>
```

`gh release create` creates the tag on the pushed commit and publishes in one step; publishing is
what fires `main.yml` (a tag alone does nothing — see the workflow's own header comment).

## 5. Wait for the workflow and verify assets

Find the run the release triggered (`gh run list --workflow=main.yml -L 3`) and watch it:
`gh run watch <run-id> --exit-status`. Once it succeeds, confirm the assets actually landed:

```
gh release view vX.Y.Z --json tagName,assets,isDraft,isPrerelease
```

Look for `module.json` and `module.zip` both present with `"state":"uploaded"`. Do not proceed to
step 6 without this.

## 6. Publish to Foundry via `tools/foundry_release.py`

Ask the user for their Foundry package API token at this point — never invent, store, echo, or log it
beyond the single command it's passed to. Per `CLAUDE.md`'s scripts-toolbox convention:

1. Run `py tools/foundry_release.py --token <token> --dry-run` first and show the full output (it
   prints the payload it would submit: repo/id/version/manifest/notes/compat, then Foundry's HTTP
   response). Confirm `HTTP 200` and `"status": "success"`.
2. Only after the dry run succeeds and the user explicitly confirms, run
   `py tools/foundry_release.py --token <token> --yes` for the real submission — `--yes` skips the
   script's own interactive confirm prompt, which is redundant once confirmation was already given in
   chat (and awkward to answer through a non-interactive tool call anyway).

The script reads the release over the unauthenticated GitHub API, so it depends on step 5's release
already being public — it does not use `gh` or need any GitHub auth itself. Use `py`, not `python`:
per `CLAUDE.md` §1, `python` on this machine may resolve to a Microsoft Store stub.

## Notes

- Don't commit, push, or publish a release without the user's explicit go-ahead at each of those
  steps — this mirrors every other mutating-action rule in `CLAUDE.md`, not something special to
  releases.
- If `gh run watch` reports a failure, read the failing step's log before assuming anything about the
  release chain — the same "assume the code is wrong before assuming the tool is wrong" rule from
  `CLAUDE.md` §4 applies to a broken release build as much as to a local test failure.
- A green test suite says nothing about whether the styling in this release is correct; `CLAUDE.md`
  §10 applies. If the release contains CSS/template changes, say plainly that visual correctness was
  not verified live.
