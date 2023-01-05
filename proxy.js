/*
 * @since 2023/01/05
 * @author ThinhHV <thinh@thinhhv.com>
 * @description nodejs-proxy-simple
 * Copyright (c) 2023 thinhhv.com
 */

var http = require('http')
var httpProxy = require('http-proxy')
var fs = require('fs')

// Default config
const CONFIGS = {
  DEFAULT_ORIGIN_HOSTNAME: 'www.google.com',
  DEFAULT_ORIGIN_SCHEMA: 'http',
  DEFAULT_ORIGIN_PORT: 80,
  // Update dynamic IP origin
  ORIGIN_LATEST_UPDATE: new Date('1970-01-01'),
  ORIGIN_PERIOD_UPDATE: 60, // seconds
  ORIGIN_UPDATE_HOST: '',
  ORIGIN_UPDATE_PATH: '/1992eea58760047d1d8e4e73242b1968',
}

// Save IP to file
function saveIP(ip) {
  fs.writeFile('ip.data', ip, (err) => {
    if (err) logger(err)
    logger('Successfully written to file.')
  })
}

// Load saved IP
fs.readFile('ip.data', function (err, buf) {
  if (err) {
    saveIP(CONFIGS.DEFAULT_ORIGIN_HOSTNAME)
    return
  }
  const ip = buf.toString()
  if (ip !== '0.0.0.0') {
    logger('Loaded IP:', ip)
    CONFIGS.DEFAULT_ORIGIN_HOSTNAME = ip
  }
})

function logger(...args) {
  // Using console.error since old version only log error
  console.error('[' + new Date().toISOString() + ']', ...args)
}

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({
  target: `${CONFIGS.DEFAULT_ORIGIN_SCHEMA}://${CONFIGS.DEFAULT_ORIGIN_HOSTNAME}:${CONFIGS.DEFAULT_ORIGIN_PORT}`,
  secure: false,
  ws: true,
})

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function (client_req, client_res) {
  logger('------------------------')

  // Config
  const config = {
    schema: client_req.headers['x-forwarded-proto'],
    host: client_req.headers['x-forwarded-host'],
    path: client_req.url,
    method: client_req.method,
    clientIp: client_req.headers['x-forwarded-for'],
  }

  // Using console.error since old version only log error
  logger('Serve:', JSON.stringify(config))

  // Update dynamic IP
  if (
    client_req.url === CONFIGS.ORIGIN_UPDATE_PATH &&
    (!CONFIGS.ORIGIN_UPDATE_HOST || CONFIGS.ORIGIN_UPDATE_HOST === config.host)
  ) {
    logger(
      'Dynamic IP:',
      CONFIGS.DEFAULT_ORIGIN_HOSTNAME,
      'noUpdate:',
      CONFIGS.DEFAULT_ORIGIN_HOSTNAME === config.clientIp,
    )
    if (
      CONFIGS.ORIGIN_LATEST_UPDATE.getTime() + CONFIGS.ORIGIN_PERIOD_UPDATE * 1000 <
      new Date().getTime()
    ) {
      logger('Dynamic old IP:', CONFIGS.DEFAULT_ORIGIN_HOSTNAME)
      CONFIGS.DEFAULT_ORIGIN_HOSTNAME = config.clientIp
      CONFIGS.ORIGIN_LATEST_UPDATE = new Date()
      logger('Dynamic new IP:', CONFIGS.DEFAULT_ORIGIN_HOSTNAME)
      saveIP(CONFIGS.DEFAULT_ORIGIN_HOSTNAME)
    }
    return client_res.end(config.clientIp + '\n')
  }

  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(client_req, client_res, {
    target: `${config.schema}://${CONFIGS.DEFAULT_ORIGIN_HOSTNAME}:${CONFIGS.DEFAULT_ORIGIN_PORT}`,
  })
})

server.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head)
})

server.listen(8080, () => {
  logger('------------------------')
  logger('Server started')
})
