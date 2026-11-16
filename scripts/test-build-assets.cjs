const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildAssets } = require('./build-assets.cjs');

async function contents(root, prefix = '') {
    const files = {};
    for (const entry of await fs.readdir(path.join(root, prefix), { withFileTypes: true })) {
        const relative = path.join(prefix, entry.name);
        if (entry.isDirectory()) Object.assign(files, await contents(root, relative));
        else files[relative] = await fs.readFile(path.join(root, relative));
    }
    return files;
}

async function main() {
    const source = path.join(__dirname, '../files');
    const original = await contents(source);
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'momo-build-test-'));
    try {
        const output = path.join(temp, 'root');
        await buildAssets(output);
        const built = await contents(output);
        assert.deepEqual(Object.keys(built).sort(), Object.keys(original).sort(), 'install file inventory');
        const js = 'www/views/gl-sdk4-ui-momo.common.js';
        const schema = 'usr/share/momo-ui/schema.json';
        for (const name of Object.keys(original)) {
            if (name === schema) assert.deepEqual(JSON.parse(built[name]), JSON.parse(original[name]), 'schema data preserved');
            else if (name !== js) assert.deepEqual(built[name], original[name], name + ' preserved');
        }
        assert(built[js].length < original[js].length, 'JS is smaller');
        const total = files => Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0);
        assert(total(built) < total(original) * 0.85, 'installed payload saves at least 15%');
        execFileSync(process.execPath, [path.join(__dirname, 'test-ui.cjs'), output], { stdio: 'inherit' });

        const second = path.join(temp, 'second');
        await buildAssets(second);
        assert.deepEqual(await contents(second), built, 'reproducible assets');
        await assert.rejects(buildAssets(output), /must be empty/, 'refuse overwriting an existing install tree');
        await assert.rejects(buildAssets(source), /outside the source/, 'protect readable source files');
        assert.deepEqual(await contents(source), original, 'source files preserved');
        console.log(`PASS build assets: ${total(original)} -> ${total(built)} bytes; schema, file inventory, source preservation and reproducibility`);
    } finally {
        await fs.rm(temp, { recursive: true, force: true });
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
