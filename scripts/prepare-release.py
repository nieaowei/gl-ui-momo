#!/usr/bin/env python3
"""Pin the release APK to the latest upstream service version and this commit."""
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request


UPSTREAM = "nikkinikki-org/OpenWrt-momo"
ROOT = Path(__file__).resolve().parent.parent


def github_json(path):
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "momo-ui-release"}
    if os.environ.get("GH_TOKEN"):
        headers["Authorization"] = "Bearer " + os.environ["GH_TOKEN"]
    request = urllib.request.Request(
        f"https://api.github.com/repos/{UPSTREAM}/{path}", headers=headers
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def metadata(text, key):
    values = re.findall(rf"^{re.escape(key)}\s*:=\s*(\S+)\s*$", text, re.MULTILINE)
    if len(values) != 1:
        raise ValueError(f"Expected one literal {key} assignment")
    return values[0]


def prepare(root=ROOT):
    latest = github_json("releases/latest")
    if latest.get("draft") or latest.get("prerelease"):
        raise ValueError("Expected a stable upstream release")
    upstream_tag = latest["tag_name"]
    upstream_commit = github_json(
        "commits/" + urllib.parse.quote(upstream_tag, safe="")
    )["sha"]
    if not re.fullmatch(r"[0-9a-f]{40}", upstream_commit):
        raise ValueError("Invalid upstream commit")
    source = github_json(f"contents/momo/Makefile?ref={upstream_commit}")
    upstream = base64.b64decode(source["content"], validate=False).decode("utf-8")
    version = metadata(upstream, "PKG_VERSION")
    release = metadata(upstream, "PKG_RELEASE")
    if not re.fullmatch(r"[0-9]+(?:\.[0-9]+)*", version) or not release.isascii() or not release.isdecimal():
        raise ValueError("Unsupported upstream service version or release")
    commit = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Invalid project commit")
    # APKv3 uses ~ for a hexadecimal commit suffix, before the -r revision.
    package_version = f"{version}~{commit[:7]}"
    makefile = root / "Makefile"
    text = makefile.read_text()
    name = metadata(text, "PKG_NAME")
    for key, value in (("PKG_VERSION", package_version), ("PKG_RELEASE", release)):
        metadata(text, key)
        text = re.sub(rf"^{key}\s*:=.*$", f"{key}:={value}", text, flags=re.MULTILINE)
    outputs = {
        "name": name,
        "version": package_version,
        "release": release,
        "tag": f"v{version}-r{release}+{commit[:7]}",
        "upstream_tag": upstream_tag,
        "upstream_commit": upstream_commit,
    }
    if any("\n" in value or "\r" in value for value in outputs.values()):
        raise ValueError("Invalid release metadata")
    makefile.write_text(text)
    return outputs


if __name__ == "__main__":
    values = prepare()
    output = "".join(f"{key}={value}\n" for key, value in values.items())
    print(output, end="")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as stream:
            stream.write(output)
