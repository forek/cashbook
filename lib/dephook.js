const addHook = require('pirates').addHook

addHook(() => '', { exts: ['.less', '.css', '.md'], ignoreNodeModules: false })
