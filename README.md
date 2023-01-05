# nodejs-proxy-simple

- This implement is a proxy server run on a shared hosting (cPanel, Apache/LiteSpeed).

![images/shared-hosting.png](images/shared-hosting.png)

# Get Started

- Only a `proxy.js` or `pure-proxy.js` file is necessary.
- Support dynamic IP: `http://localhost:8080/1992eea58760047d1d8e4e73242b1968`

## Install

- Install dependencies:
  ```bash
  yarn
  ```

## Setup

- Server:
  - yarn start
- Shared Hosting:
  - Upload `proxy.js` and `node_modules` to `public_html/proxy`.
  - Configure as in above picture.
  - Point domain/subdomain DNS to shared hosting's IP
