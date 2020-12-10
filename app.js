const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const mysqlStore = require('express-mysql-session')(session)
const { log } = require('console')
const { cors } = require('./utils/config-use.js')

const indexRouter = require('./router/indexRouter')
const homeRouter = require('./router/homeRouter')
const detailRouter = require('./router/detailRouter')
const orderRouter = require('./router/orderRouter')
const profileRouter = require('./router/profileRouter')
const userRouter = require('./router/userRouter')
const otherRouter = require('./router/otherRouter')
const testRouter = require('./router/testRouter')

const app = express()
const HOUR = 1000 * 60 * 60 // hour 毫秒数
const sessionMysqlOptions = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'project'
}
const sessionStore = new mysqlStore(sessionMysqlOptions)
const sessionOptions = {
  secret: 'haah BBB',
  key: 'gwj_sid',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { 
    maxAge: HOUR*10,
    httpOnly: true,
    path: '/'
  }
}



// 配置中间件 请求头的处理
app.use(cors)
app.use(cookieParser())
app.use(session(sessionOptions))
// 局部中间件
app.use('/public', express.static(path.join(__dirname, 'public')))


// 页面路由
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
app.get('/order', (req, res) => {
  if (req.session.isLogin === true) {
    req.query.uid = req.session.uid
    return res.sendFile( path.join(__dirname, 'views/order.html') )
  }
  res.redirect(302, '/login')
  // res.sendFile( path.join(__dirname, 'views/noLogin.html') )
})
app.get('/profile', (req, res) => {
  if (req.session.isLogin === true) {
    req.query.uid = req.session.uid
    return res.sendFile( path.join(__dirname, 'views/profile.html') )
  }
  res.redirect(302, '/login')
  
})


// API路由中间件
app.use('/', indexRouter)
app.use('/home', homeRouter)
app.use('/detail', detailRouter)          // 权限分配
app.use('/order', orderRouter)            // 权限分配
app.use('/profile', profileRouter)        // 权限分配
app.use('/user', userRouter)
app.use('/other', otherRouter)
app.use('/test', testRouter)
app.use((req,res,next) => {
  res.sendFile( path.join(__dirname, 'views/404.html') )
})

app.listen(2021, () => {
  log('2021 端口开启成功')
})