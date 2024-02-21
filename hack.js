const fs = require('fs');
const { resolve } = require('path');
const nmPath = resolve(__dirname, './node_modules');
console.log('[hack] fix post_link')
path = resolve(nmPath, './hexo/dist/plugins/tag/post_link.js')

// path = resolve('./post_link.js')

content = fs.readFileSync(path, { encoding: 'utf-8'})
// console.log(content)
m = content.match(/const url = new URL.*\n.*encodeURL\)\(url\);/gm)
if (m != null) {    
    console.log(m)
    content = content.replace(/const url = new URL.*\n.*encodeURL\)\(url\);/gm, "const link = hexo_util_1.url_for.call(ctx, post.path + (hash ? `#${hash}` : ''));")
    // content = content.replace(/const devices = \(0, _parseIOSDevicesList.default\)\(_child_process.+\n(.+\n)*/gm, `const devices = (0, _parseIOSDevicesList.default)(_execa().default.sync('xcrun', ['xctrace', 'list', 'devices']));`)    
    fs.writeFileSync(path, content)
}