import mongoose, { Mongoose } from 'mongoose'

declare global {
  var mongoose: { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI no está definido')

let cached = global.mongoose ?? (global.mongoose = { conn: null, promise: null })

export async function connectDB() {
  if (cached.conn) return cached.conn
  cached.promise = cached.promise || mongoose.connect(MONGODB_URI)
  cached.conn = await cached.promise
  return cached.conn
}
