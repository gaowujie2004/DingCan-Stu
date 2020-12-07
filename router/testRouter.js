const express = require('express')
const path = require('path')
const multer = require('multer')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const upload = multer({ dest: '/public/img' })
const urlencoded = express.urlencoded({ extended: false })
const router = express.Router()

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
  console.log('查询字符串对象 query|params: ', req.query)
  response.send(req.query)
})
router.all('/all', (req, res) => {
  console.log('无论什么请求, 都会过来')
  res.send({
    'Content-Type': req.header('Content-Type'),
      
  })
})


module.exports = router