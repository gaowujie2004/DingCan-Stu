const express = require('express')
const path = require('path')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.use((req, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  next()
})
router.get('/', (req, res) => {
  res.send('<h1>首页</h1>')
})

module.exports = router