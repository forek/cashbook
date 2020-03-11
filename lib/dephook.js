const addHook = require('pirates').addHook

// .less .css
addHook(() => '', { exts: ['.less', '.css'], ignoreNodeModules: false })
