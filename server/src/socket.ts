/**
 * Socket.io singleton
 *
 * Allows routes to emit events without circular imports.
 * Call initSocket(server) once at startup, then getIO() anywhere.
 */

import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'

let io: SocketServer | null = null

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping timeout/interval tuning for reliability
    pingTimeout: 20000,
    pingInterval: 10000,
  })

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Send current state immediately on connect
    socket.on('REQUEST_STATE', () => {
      const { getTotalLikes, getConfig } = require('./db/database')
      const total = getTotalLikes()
      const likesToLaunch = parseInt(getConfig('likes_to_launch') ?? '10000', 10)
      socket.emit('STATE_SYNC', {
        total,
        energyPercent: Math.min(100, Math.floor((total / likesToLaunch) * 100)),
        launchTriggered: getConfig('launch_triggered') === '1',
      })
    })

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}

export function getIO(): SocketServer {
  if (!io) {
    // Return a no-op fake if socket not initialized (e.g., during tests)
    return {
      emit: () => {},
    } as unknown as SocketServer
  }
  return io
}
