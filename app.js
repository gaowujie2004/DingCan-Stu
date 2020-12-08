const path = require('path')
const express = require('express')
const { log } = require('console')

const { cors } = require('./utils/config-use.js')

const indexRouter = require('./router/indexRouter')
const homeRouter = require('./router/homeRouter')
const detailRouter = require('./router/detailRouter')
const orderRouter = require('./router/orderRouter')
const profileRouter = require('./router/profileRouter')
const testRouter = require('./router/testRouter')

const app = express()

// 配置中间件 请求头的处理
app.use(cors)

app.get('/', (req, res, next) => {
  res.sendFile( path.join(__dirname, 'views/index.html') )
})
app.get('/login', (req, res) => {
  res.sendFile( path.join(__dirname, 'views/login.html') )
})
app.get('/sigin', (req, res) => {
  res.sendFile( path.join(__dirname, 'views/sigin.html') )
})
app.get('/collect', (req, res) => {
  res.sendFile( path.join(__dirname, 'views/collect.html') )
})
app.get('/reservetop', (req, res) => {
  res.sendFile( path.join(__dirname, 'views/reserveTop.html') )
})
app.get('/search', (req, res) => {
  res.sendFile( path.join(__dirname, 'views/searchList.html') )
})
app.get('/category', (req, res) => {
  res.sendFile( path.join(__dirname, 'views/category.html') )
})

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