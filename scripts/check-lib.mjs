import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

execSync('pnpm build:lib', { stdio: 'inherit' })

const requiredFiles = [
  'dist-lib/index.js',
  'dist-lib/index.d.ts'
]

const missingFiles = requiredFiles.filter(file => !existsSync(resolve(process.cwd(), file)))

if (missingFiles.length > 0) {
  console.error('缺少组件库产物文件:')
  for (const file of missingFiles) {
    console.error(`- ${file}`)
  }
  process.exit(1)
}

console.log('组件库产物检查通过。')
