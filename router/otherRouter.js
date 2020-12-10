const express = require('express')
const path = require('path')
const { log } = require('console')
const router = express.Router()

router.get('/isLogin', (req, res) => {
  if (req.session.isLogin === true) {
    return res.send('1')
  }
  res.send('0')
})

module.exports = router 