const express = require('express')
// const cookieParser = require('cookie-parser')
// const session = require('express-session')
const path = require('path')
const multer = require('multer')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const HOUR = 1000 * 60 * 60 // hour 毫秒数
const upload = multer({ dest: '/public/img' })
const urlencoded = express.urlencoded({ extended: false })
const router = express.Router()


// router.use(cookieParser())
// router.use(session(sessionOptions))
// router.use((req, res, next) => {
//   req.session.name = 'gaowujie'
//   next()
// })


router.get('/', async(req, response) => {
  response.send(['查看 session' ,req.session, '有 uid 查询字符串吗', req.query])
})

router.get('/session', async(req, response) => {
  response.send(['查看 session' ,req.session])
})

router.all('/all', (req, res) => {
  console.log('无论什么请求, 都会过来')
  res.send({
    'Content-Type': req.header('Content-Type'),
      
  })
})


module.exports = router