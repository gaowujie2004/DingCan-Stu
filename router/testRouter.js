const express = require('express')
const path = require('path')
const { log } = require('console')

const router = express.Router()
router.get('/', (req, response) => {
  response.send('<h1>TEST/首页啊 2021端口</h1>')
})

module.exports = router