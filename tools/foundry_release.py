#!/usr/bin/env python3
"""Publish the most recent GitHub release of this module to Foundry's package listing.

Looks up this repo's latest GitHub release, reads the module.json asset attached to it, and POSTs
it to Foundry's Package Release API: https://foundryvtt.com/article/package-release-api/

Note that the repo's own module.json is a template: version/url/manifest/download are "#{...}#"
tokens that .github/workflows/main.yml substitutes at release time. The local file therefore has no
version to read -- this script reads the released module.json asset instead, which is both the real
source of truth and the exact bytes Foundry will fetch.

The Foundry API token is never stored in this file -- pass it with --token. Always run with
--dry-run first (Foundry validates the submission without saving it); only drop --dry-run once
that succeeds.

Usage:
    py tools/foundry_release.py --token fvttp_xxx --dry-run
    py tools/foundry_release.py --token fvttp_xxx

Options:
    --token TOKEN        Foundry package API token (required). Never logged or echoed.
    --dry-run            Ask Foundry to validate the submission without saving it.
    --yes                Skip the confirmation prompt before a real (non-dry-run) submission.
    --repo OWNER/NAME    GitHub repo to read the release from (default: the releases repo below).
    --tag TAG            Release tag to submit (default: whatever GitHub reports as latest).
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

GITHUB_API = "https://api.github.com"
FOUNDRY_RELEASE_API = "https://foundryvtt.com/_api/packages/release_version/"

# Releases are cut from the overhaul repo, not the one package.json's homepage/bugs point at.
DEFAULT_REPO = "ctincorvia/masks-newgeneration-unofficial-overhaul"

TOKENIZED_FIELDS = ("version", "url", "manifest", "download")


def http_get_json(url, accept="application/vnd.github+json"):
    request = urllib.request.Request(url, headers={"Accept": accept})
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def fetch_release(owner_repo, tag):
    if tag:
        url = f"{GITHUB_API}/repos/{owner_repo}/releases/tags/{tag}"
    else:
        url = f"{GITHUB_API}/repos/{owner_repo}/releases/latest"
    try:
        return http_get_json(url)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            what = f"release tagged {tag!r}" if tag else "any published release"
            sys.exit(f"error: GitHub has no {what} for {owner_repo}. Check --repo/--tag.")
        raise


def find_asset_url(release, filename):
    for asset in release.get("assets", []):
        if asset.get("name") == filename:
            return asset["browser_download_url"]
    return None


def build_payload(release, manifest_url, released_manifest, local_version, dry_run):
    tag = release["tag_name"]
    tag_version = tag[1:] if tag.startswith("v") else tag

    for field in TOKENIZED_FIELDS:
        value = released_manifest.get(field, "")
        if "#{" in str(value):
            sys.exit(
                f"error: the released module.json still has an unsubstituted token in {field!r} "
                f"({value!r}). The workflow's replace-tokens step did not run -- re-run the release "
                "build before submitting this to Foundry."
            )

    version = released_manifest["version"]
    if version != tag_version:
        sys.exit(
            f"error: release {tag!r} (version {tag_version!r}) has a module.json asset declaring "
            f"version {version!r}. The release was built from the wrong ref -- fix the release "
            "before submitting it."
        )
    if version != local_version:
        sys.exit(
            f"error: release {tag!r} is version {version!r}, but local package.json is at "
            f"{local_version!r}. Check out/pull the matching tag before releasing, so this is read "
            "from the right commit."
        )

    compatibility = released_manifest["compatibility"]
    release_compatibility = {
        "minimum": compatibility["minimum"],
        "verified": compatibility["verified"],
    }
    if compatibility.get("maximum"):
        release_compatibility["maximum"] = compatibility["maximum"]

    payload = {
        "id": released_manifest["id"],
        "release": {
            "version": version,
            # The version-specific asset URL, not the manifest's own /latest/ one: Foundry needs a
            # per-version manifest so previously listed versions stay resolvable.
            "manifest": manifest_url,
            "notes": release["html_url"],
            "compatibility": release_compatibility,
        },
    }
    if dry_run:
        payload["dry-run"] = True
    return payload


def submit(payload, token):
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        FOUNDRY_RELEASE_API,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": token,
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(detail)
        except json.JSONDecodeError:
            pass
        if error.code == 429:
            retry_after = error.headers.get("Retry-After")
            sys.exit(f"error: rate limited by Foundry (HTTP 429). Retry after {retry_after} seconds. Body: {detail}")
        return error.code, detail


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--token", required=True, help="Foundry package API token (never logged)")
    parser.add_argument("--dry-run", action="store_true", help="validate with Foundry without saving")
    parser.add_argument("--yes", action="store_true", help="skip confirmation before a real submission")
    parser.add_argument("--repo", default=DEFAULT_REPO, help=f"GitHub owner/name (default: {DEFAULT_REPO})")
    parser.add_argument("--tag", default=None, help="release tag to submit (default: GitHub's latest)")
    args = parser.parse_args()

    local_version = json.loads(
        (Path(__file__).resolve().parent.parent / "package.json").read_text(encoding="utf-8")
    )["version"]

    release = fetch_release(args.repo, args.tag)
    manifest_url = find_asset_url(release, "module.json")
    if manifest_url is None:
        sys.exit(
            f"error: release {release['tag_name']!r} has no module.json asset attached -- nothing to "
            "point Foundry at. Wait for the release workflow to finish uploading it."
        )
    released_manifest = http_get_json(manifest_url, accept="application/json")
    payload = build_payload(release, manifest_url, released_manifest, local_version, args.dry_run)

    print(f"repo:       {args.repo}")
    print(f"id:         {payload['id']}")
    print(f"version:    {payload['release']['version']}")
    print(f"manifest:   {payload['release']['manifest']}")
    print(f"notes:      {payload['release']['notes']}")
    print(f"compat:     {payload['release']['compatibility']}")
    print(f"dry-run:    {args.dry_run}")

    if not args.dry_run and not args.yes:
        answer = input("Submit this REAL release to Foundry? [y/N] ").strip().lower()
        if answer != "y":
            sys.exit("aborted.")

    status, response_body = submit(payload, args.token)
    print(f"HTTP {status}")
    print(json.dumps(response_body, indent=2))
    if status >= 400:
        sys.exit(1)


if __name__ == "__main__":
    main()
