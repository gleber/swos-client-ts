import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Headers, Request, Response, fetch } from 'undici'
import { afterAll, afterEach, beforeAll } from 'vitest'

// biome-ignore lint/suspicious/noExplicitAny: mock
global.fetch = fetch as any
// biome-ignore lint/suspicious/noExplicitAny: mock
global.Headers = Headers as any
// biome-ignore lint/suspicious/noExplicitAny: mock
global.Request = Request as any
// biome-ignore lint/suspicious/noExplicitAny: mock
global.Response = Response as any

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

export { server, http, HttpResponse }
