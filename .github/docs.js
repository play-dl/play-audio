const fs = require('fs')

const path = "play-audio/index.ts"

if(!fs.existsSync(path)) {
    console.log('File Missing')
    process.exit(1)
}

const oldData = fs.readFileSync(path, 'utf-8')

fs.writeFileSync(path, oldData.split('export default')[0])