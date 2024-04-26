import { REPLServer } from 'repl'
import path from 'path'
import { makeTag } from './sh'

export function loadContext(
  r: REPLServer,
  options: { verbose?: boolean; client?: string },
) {
  for (const p of Object.keys(require.cache)) {
    delete require.cache[p]
  }
  r.context.sh = makeTag('')
  r.context.prisma = makeTag('prisma ', (command) => {
    if (command === 'db push' || command === 'generate') {
      loadContext(r, options)
    }
  })
  const { PrismaClient, Prisma } = loadPrisma(options.client)
  r.context.db = createPrismaClient(PrismaClient, {
    url: process.env.DATABASE_URL,
    verbose: options.verbose,
  })
  r.context.Prisma = Prisma
}

function createPrismaClient(PrismaClient: any, {
  url,
  verbose,
}: { url?: string; verbose?: boolean } = {}) {
  return new PrismaClient({
    log: verbose ? ['query', 'info', 'warn', 'error'] : undefined,
    datasources: url
      ? {
          db: {
            url,
          },
        }
      : undefined,
  })
}

function loadPrisma(client?: string) {
  const {
    PrismaClient,
    Prisma,
  }: typeof import('@prisma/client') = require(path.resolve(
    client || 'node_modules/@prisma/client',
  ))
  return { PrismaClient, Prisma }
}