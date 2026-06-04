import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { createServer, type IncomingMessage, type ServerResponse, type Server as NodeHttpServer } from 'node:http'

type AdonisHttpServer = {
  boot: () => Promise<void>
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void
  setNodeServer: (server: NodeHttpServer) => void
}

const APP_ROOT = new URL('../build/', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }

  return import(filePath)
}

let serverBootPromise: Promise<AdonisHttpServer> | null = null

async function bootServer(): Promise<AdonisHttpServer> {
  if (serverBootPromise) return serverBootPromise

  serverBootPromise = (async () => {
    const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER }).tap((app) => {
      app.booting(async () => {
        await import(new URL('./start/env.js', APP_ROOT).href)
      })
    })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    let adonisServer: AdonisHttpServer | null = null

    await app.start(async () => {
      const resolvedServer = (await app.container.make('server')) as AdonisHttpServer
      await resolvedServer.boot()

      const nodeServer = createServer(resolvedServer.handle.bind(resolvedServer))
      resolvedServer.setNodeServer(nodeServer)

      adonisServer = resolvedServer
    })

    if (!adonisServer) {
      throw new Error('No se pudo iniciar el servidor HTTP de Adonis para Vercel')
    }

    return adonisServer
  })().catch((error) => {
    serverBootPromise = null
    throw error
  })

  return serverBootPromise
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const server = await bootServer()
    await server.handle(req, res)
  } catch (error) {
    process.exitCode = 1
    prettyPrintError(error)

    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ message: 'Error al inicializar Adonis en Vercel' }))
      return
    }

    if (!res.writableEnded) {
      res.end()
    }
  }
}
