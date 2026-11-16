// Shared install tree for the OpenWrt build and standalone APK packager.
const fs = require('node:fs/promises');
const path = require('node:path');
const { minify } = require('terser');

async function buildAssets(output) {
    const source = await fs.realpath(path.join(__dirname, '../files'));
    await fs.mkdir(output, { recursive: true });
    output = await fs.realpath(output);
    if (output === source || output.startsWith(source + path.sep) || source.startsWith(output + path.sep)) {
        throw new Error('Output must be outside the source files tree.');
    }
    if ((await fs.readdir(output)).length) throw new Error('Output directory must be empty.');

    await fs.cp(source, output, { recursive: true });
    const view = path.join(output, 'www/views/gl-sdk4-ui-momo.common.js');
    const result = await minify(await fs.readFile(view, 'utf8'), {
        ecma: 5,
        compress: true,
        // Vue component properties and RPC names must retain their public names.
        mangle: { properties: false },
        format: { comments: false, ascii_only: false }
    });
    await fs.writeFile(view, result.code + '\n');
    const schema = path.join(output, 'usr/share/momo-ui/schema.json');
    await fs.writeFile(schema, JSON.stringify(JSON.parse(await fs.readFile(schema, 'utf8'))) + '\n');
}

module.exports = { buildAssets };
if (require.main === module) {
    if (process.argv.length !== 3) {
        console.error('Usage: node scripts/build-assets.cjs EMPTY_OUTPUT_DIRECTORY');
        process.exitCode = 1;
    } else {
        buildAssets(path.resolve(process.argv[2])).catch(error => {
            console.error(error.message);
            process.exitCode = 1;
        });
    }
}
