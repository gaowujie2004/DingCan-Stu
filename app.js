const path = require('path')
const express = require('express')
const { log } = require('console')

const indexRouter = require('./router/indexRouter')
const testRouter = require('./router/testRouter')
const homeRouter = require('./router/homeRouter')
const orderRouter = require('./router/orderRouter')

const app = express()
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/', indexRouter)
app.use('/home', homeRouter)
app.use('/order', orderRouter)
app.use('/test', testRouter)

app.listen(2021, () => {
  log('2021 端口开启成功')
})