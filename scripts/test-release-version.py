#!/usr/bin/env python3
"""Exercise upstream pinning, version propagation and failure without mutation."""
import base64
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "release_version", Path(__file__).with_name("prepare-release.py")
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReleaseVersionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.makefile = self.root / "Makefile"
        self.original = "PKG_NAME:=gl-sdk4-ui-momo\nPKG_VERSION:=1.3.0\nPKG_RELEASE:=9\n"
        self.makefile.write_text(self.original)
        self.upstream = "PKG_VERSION:=2026.10.14\nPKG_RELEASE:=2\n"
        self.calls = []

    def fetch(self, path):
        self.calls.append(path)
        if path == "releases/latest":
            return {"tag_name": "v1.2.2", "draft": False, "prerelease": False}
        if path == "commits/v1.2.2":
            return {"sha": "f" * 40}
        if path == f'contents/momo/Makefile?ref={"f" * 40}':
            return {"content": base64.b64encode(self.upstream.encode()).decode()}
        self.fail(f"Unexpected upstream request: {path}")

    def prepare(self):
        with patch.object(module, "github_json", side_effect=self.fetch), patch.object(
            module.subprocess, "check_output", return_value="abcdef0123456789" + "0" * 24 + "\n"
        ):
            return module.prepare(self.root)

    def test_service_version_and_revision_with_project_hash(self):
        values = self.prepare()
        self.assertEqual(values["version"], "2026.10.14~abcdef0")
        self.assertEqual(values["release"], "2")
        self.assertEqual(values["tag"], "v2026.10.14-r2+abcdef0")
        self.assertEqual(values["upstream_commit"], "f" * 40)
        self.assertIn("PKG_VERSION:=2026.10.14~abcdef0\nPKG_RELEASE:=2\n", self.makefile.read_text())
        self.assertEqual(len(self.calls), 3)
        # Re-running prepares the same version, without appending a second hash.
        self.assertEqual(self.prepare(), values)

    def test_invalid_upstream_version_leaves_makefile_unchanged(self):
        for upstream in (
            "PKG_VERSION:=$(VERSION)\nPKG_RELEASE:=1\n",
            "PKG_VERSION:=2026.10.14\n",
            "PKG_VERSION:=2026.10.14\nPKG_RELEASE:=1\nPKG_RELEASE:=2\n",
        ):
            with self.subTest(upstream=upstream):
                self.upstream = upstream
                with self.assertRaises(ValueError):
                    self.prepare()
                self.assertEqual(self.makefile.read_text(), self.original)

    def test_network_failure_leaves_makefile_unchanged(self):
        with patch.object(module, "github_json", side_effect=OSError("network failure")):
            with self.assertRaises(OSError):
                module.prepare(self.root)
        self.assertEqual(self.makefile.read_text(), self.original)


if __name__ == "__main__":
    unittest.main()
