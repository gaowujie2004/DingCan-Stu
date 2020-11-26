const express = require('express')
const path = require('path')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.post('/img', async(req, response) => {
  let src = req.query.src
  let uid = req.query.uid
  try {
    let imgPath = `/public/img/profile/${src}.jpg`
    let { results, field } = await query(`update user set uimg='${imgPath}' where uid=${uid}`)
    log(results)
    if (results.affectedRows > 0) {
      response.send('1')
    } else {
      response.send('0')
    }
  } catch(err) {
    console.log('------------------------此处有误---', err)
    response.statusCode = 500
    response.statusMessage = 'error'
    response.send('error')
  }
})

router.post('/nickname', async(req, response) => {
  try {
    let uid = req.query.uid
    let nickname = req.query.name
    
    if (nickname.length > 6) {
      response.send('0') // 昵称不符合要求
    }

    let { results } = await query(`update user set unickname='${nickname}' where uid=${uid}`)
    if (results.affectedRows > 0) {
      response.send('1')
    } else {
      response.send('0')
    }
  } catch(err) {
    log('------此处有误-------', err) 
    response.statusCode = 500
    response.send('年轻人, 不要太好奇')
  }
})

router.post('/pwd', async(req, response) => {
  /**
   * 修改密码 接口
  */
  try {
    let uid = req.query.uid
    let pwd = req.query.pwd
    let newPwd = req.query.newpwd

    if (newPwd.length < 6 || newPwd.length > 20) {
      response.send('-1')
      return
    }
    let { results } = await query(`update user set upwd='${newPwd}' where upwd='${pwd}' and uid=${uid}`)
    if (results.affectedRows > 0) {
      response.send('1')
    } else {
      response.send('0')
    }
  } catch(err) {
    log('------此处有误-------', err) 
    response.statusCode = 500
    response.send('年轻人, 不要太好奇')
  }
})

router.get('/like', async(req, response) => {
  /**
   * 收藏列表
  */
  try {
    let uid = req.query.uid
    let { results } = await query(`select user_like.sid,slogo as logo,shopname,scanteen as canteen,slogan as logan from (user_like left join shopkeeper on user_like.sid=shopkeeper.sid) where uid=${uid}`)
    response.send(results)
  } catch(err) {
    log('------此处有误-------', err) 
    response.statusCode = 500
    response.send('年轻人, 不要太好奇')
  }
})

router.post('/exit', async(req, response) => {
  try {
    let uid = req.query.uid
    //
    response.send('退出登录成功. 即将跳转到首页'+req.ip)
  } catch(err) {
    log('-------有误-------', err)
    response.statusCode = 500
    response.send('年轻人, 不要太好奇')
  }
})

module.exports = router