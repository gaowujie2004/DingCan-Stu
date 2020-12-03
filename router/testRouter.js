const express = require('express')
const path = require('path')
const multer = require('multer')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const upload = multer({ dest: '/public/img' })
const urlencoded = express.urlencoded({ extended: false })
const router = express.Router()
router.use('/', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

async function errorCaptured(asyncFunc) {
  try {
    if (typeof asyncFunc === 'function') {
      let res = await asyncFunc()
      return [null, res]
    } else {
      let res = await asyncFunc
      return [null, res]
    }
  } catch(err) {
    return [err, null]
  }
}

router.get('/', async(req, response) => {
  // 商家列表
  let [err, res] = await errorCaptured(query(`select * from shopkeeperx limit 5`))
  if (err) {
    log('有误-------', err)
    response.send('error')
  } else {
    response.send(res.results)
  }
})

module.exports = router