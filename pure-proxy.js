/*
 * @since 2023/01/05
 * @author ThinhHV <thinh@thinhhv.com>
 * @description nodejs-proxy-simple
 * Copyright (c) 2023 thinhhv.com
 */

// NOT SUPPORT WEBSOCKET

var http = require('http')
var fs = require('fs')

// Default config
const CONFIGS = {
  DEFAULT_ORIGIN_HOSTNAME: 'www.google.com',
  DEFAULT_ORIGIN_PORT: 80,
  DEFAULT_HOST: 'localhost',
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

// Handle requests
function onRequest(client_req, client_res) {
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
    return client_res.end(config.clientIp)
  }

  // Options
  var options = {
    hostname: CONFIGS.DEFAULT_ORIGIN_HOSTNAME,
    port: CONFIGS.DEFAULT_ORIGIN_PORT,
    host: config.host || CONFIGS.DEFAULT_HOST,
    path: client_req.url,
    method: client_req.method,
    rejectUnauthorized: false,
    headers: {
      ...client_req.headers,
      host: config.host || CONFIGS.DEFAULT_HOST,
    },
  }

  // Request to origin
  var proxy = http.request(options, function (res) {
    client_res.writeHead(res.statusCode, res.headers)
    res.pipe(client_res, {
      end: true,
    })
  })

  // Send res from origin to client
  client_req.pipe(proxy, {
    end: true,
  })
}

// Create server
http.createServer(onRequest).listen(8080, () => {
  logger('------------------------')
  logger('Server started')
})
