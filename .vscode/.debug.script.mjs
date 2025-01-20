import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { exec } from 'node:child_process'

const pkg = createRequire(import.meta.url)('../package.json')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// write .debug.env
const envContent = Object.entries(pkg.debug.env).map(([key, val]) => `${key}=${val}`)
fs.writeFileSync(path.join(__dirname, '.debug.env'), envContent.join('\n'))

// bootstrap
const command = process.platform === 'win32' ? 'npm.cmd run dev' : 'npm run dev'

exec(command, {
  stdio: 'inherit',
  env: Object.assign(process.env, { VSCODE_DEBUG: 'true' }),
}, (error, stdout, stderr) => {
  if (error) {
    console.error(`执行出错: ${error}`)
    return
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
})