import { defineConfig } from 'tsdown'

export default defineConfig(
  {
    entry: ['./src/index.ts'],
    format: 'esm',
    target: 'es2022',
  },
)
