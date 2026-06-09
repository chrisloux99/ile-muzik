import { Router, type Request, type Response, type NextFunction } from 'express'
import { config } from '../config/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function getSubsonicParams(): Record<string, string> {
  return {
    u: config.navidrome.adminUser,
    p: config.navidrome.adminPass,
    v: '1.16.1',
    f: 'json',
    c: 'iLe-Play',
  }
}

function toQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

// Proxy all Subsonic API requests through the backend
router.get('/*', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subsonicPath = req.path.replace(/^\//, '')
    const queryParams = new URLSearchParams(req.query as Record<string, string>)
    const subsonicParams = getSubsonicParams()

    const fullUrl = `${config.navidrome.url}/rest/${subsonicPath}?${toQueryString(subsonicParams)}&${queryParams.toString()}`

    const response = await fetch(fullUrl)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Navidrome request failed' })
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Stream endpoint (returns binary audio)
router.get('/stream', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.query.id
    if (!id) {
      return res.status(400).json({ error: 'Missing track id' })
    }

    const subsonicParams = getSubsonicParams()
    const url = `${config.navidrome.url}/rest/stream?id=${id}&${toQueryString(subsonicParams)}`

    const response = await fetch(url)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Stream failed' })
    }

    // Forward headers
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    if (contentType) res.setHeader('Content-Type', contentType)
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Stream the audio
    if (response.body) {
      const reader = response.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      }
      await pump()
    } else {
      res.end()
    }
  } catch (err) {
    next(err)
  }
})

// Cover art endpoint (returns binary image)
router.get('/getCoverArt', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.query.id
    if (!id) {
      return res.status(400).json({ error: 'Missing cover art id' })
    }

    const subsonicParams = getSubsonicParams()
    const size = req.query.size || '300'
    const url = `${config.navidrome.url}/rest/getCoverArt?id=${id}&size=${size}&${toQueryString(subsonicParams)}`

    const response = await fetch(url)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Cover art failed' })
    }

    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    if (contentType) res.setHeader('Content-Type', contentType)
    if (contentLength) res.setHeader('Content-Length', contentLength)

    if (response.body) {
      const reader = response.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      }
      await pump()
    } else {
      res.end()
    }
  } catch (err) {
    next(err)
  }
})

export default router
