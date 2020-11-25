const path = require('path')
const express = require('express')
const { log } = require('console')

const indexRouter = require('./router/indexRouter')   // /
const homeRouter = require('./router/homeRouter')
const detailRouter = require('./router/detailRouter')
const orderRouter = require('./router/orderRouter')
const profileRouter = require('./router/profileRouter')
const testRouter = require('./router/testRouter')

const app = express()
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/', indexRouter)
app.use('/home', homeRouter)
app.use('/detail', detailRouter)
app.use('/order', orderRouter)
app.use('/profile', profileRouter)
app.use('/test', testRouter)

app.listen(2021, () => {
  log('2021 端口开启成功')
})