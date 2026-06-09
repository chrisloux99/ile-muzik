const isProduction = process.env.NODE_ENV === 'production'

function formatMessage(level: string, msg: string, ...args: any[]): string {
  const timestamp = new Date().toISOString()
  const extra = args.length > 0 ? ' ' + args.map(a =>
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ') : ''
  return `[${timestamp}] [${level}] ${msg}${extra}`
}

export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(formatMessage('INFO', msg, ...args))
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(formatMessage('WARN', msg, ...args))
  },
  error: (msg: string, ...args: any[]) => {
    console.error(formatMessage('ERROR', msg, ...args))
  },
  debug: (msg: string, ...args: any[]) => {
    if (!isProduction) {
      console.log(formatMessage('DEBUG', msg, ...args))
    }
  },
}
