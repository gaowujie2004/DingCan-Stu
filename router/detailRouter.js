const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const multer = require('multer')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.use((req, res, next) => {
  if (req.session.isLogin === true) {
    req.query.uid = req.session.uid
    return next()
  }
  req.query.uid = -1
  next()
})
const urlencoded = bodyParser.urlencoded({ extended: false })
const commentStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../DIngCan-Public/img/comment') )
    console.log('评论图片 存放地址', path.join(__dirname, '../../DIngCan-Public/img/comment'))
    // console.log(path.join(__dirname, '../../DIngCan-Public/img/comment'))

  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const commentUpload = multer({ storage: commentStorage, limits: { fileSize: 20*1024*1024 } })


router.get('/', async(req, response) => {
  /**
   * 额外功能 - 浏览量增加 - 插入shop_browser表
  */
  let sid = req.query.sid
  try {
    response.sendFile( path.join(__dirname, '../views/detail3.html') )
    query(`insert into shop_browser(sid) values(${sid})`)
  } catch(err) {
    // console.log('------------------------此处有误' ,err)
    response.statusCode = 400
    response.statusMessage = 'error'
    response.send('error')
  }
})

router.post('/collect', async(req, response) => {
  let sid = req.query.sid
  let uid = req.query.uid
  let state = req.query.state

  if (uid === -1) {
    // -1 未登录
    return response.send('-1') 
  }

  try {
    if (state === 'true') {
      query(`insert into user_like(uid,sid) values(${uid}, ${sid})`)
      .then(val => {
        response.send('1')
      })
      .catch(err => {
        response.statusCode = 400
        response.send('0') // 重复操作
      })
    } else {
      query(`delete from user_like where sid=${sid} and uid=${uid}`)
      .then(val => {
        response.send('1')
      })
      .catch(err => {
        response.statusCode = 400
        response.send('0') // 错误操作
        console.log(err)
      })
    }
    
  } catch(err) {
    console.log('------------------------此处有误' ,err)
    response.statusCode = 500   // 500 是服务器错误
    response.send('error')
  }
})

router.post('/like', async(req, response) => {
  /**
   * 点整功能
   * 参数：	uid=xxx & sid=xxxxlike=true|false&  商家ID
   * 附带:  符合要求后 修改商家表中的 slikenum字段      这样 耦合度高了.  我怕修改了这个, 影响了其他的了
  */
  let sid = req.query.sid 
  let uid = req.query.uid 
  let like = req.query.like

  if (uid === -1) {
    return response.send('-1')
  }

  try {
    if (like === 'true') {
      await query(`insert into shop_like(sid,uid) values(${sid}, ${uid})`)
      response.send('1')
    } else {
      let { results } = await query(`delete from shop_like where sid=${sid} and uid=${uid}`)
      if (results.affectedRows > 0) {
        response.send('1')
      } else {
        response.send('0')
      }
    }
  } catch(err) {
    // console.log('------------------------此处有误' ,err)
    response.statusCode = 400
    response.statusMessage = 'error'
    response.send('0')
  }
})

router.get('/top', async(req, response) => {
  /**
   * 头部信息
   * 参数: sid=xxx
  */
  let sid = req.query.sid
  let uid = req.query.uid
  try {
    
    let shopPromise = query(`select shopname,scanteen,slogo,likenum from (shopkeeper left join (select sid,count(*) as likenum from shop_like group by sid) as shoplike on shopkeeper.sid=shoplike.sid) where shopkeeper.sid=${sid}`)   
    let showPromise = query(`select img from shop_show where sid=${sid}`) 
    let commentPromise = query(`select avg(score) as avgscore,count(*) as count from shop_comment where sid=${sid}`)
    let likePromise, collectPromise
    if (!uid) { // 没有uid参数时
      likePromise = Promise.resolve({results: []})
      collectPromise = Promise.resolve({results: []})
    } else {
      likePromise = query(`select sid from shop_like where sid=${sid} and uid=${uid}`)
      collectPromise = query(`select uid from user_like where sid=${sid} and uid=${uid}`)
    }
    let promiseAllList = await Promise.all([
      shopPromise, showPromise,
      commentPromise, likePromise,
      collectPromise
    ])
    
    let { shopname: shopName, scanteen: canteen, slogo: logo, slikenum: likeNum } = promiseAllList[0].results[0]   // ok
    let showList = promiseAllList[1].results.reduce((temp, item) => {
      if (item.img) {
        temp.push(item.img)
      }
      return temp
    }, [])
        showList.unshift(logo)
    let commentObj = promiseAllList[2].results[0]
    let score = Number(commentObj?.avgscore?.toFixed(2)) || 0
    let commentNum = commentObj.count || 0
    let isLike = promiseAllList[3]?.results.length > 0 ? true : false
    let isCollect = promiseAllList[4].results.length > 0 ? true : false

    response.send({
      shopName,canteen,likeNum,score,commentNum,isLike,isCollect,showList
    })
  } catch(err) {
    console.log('------------------------此处有误' ,err)
    response.statusCode = 400
    response.statusMessage = 'error'
    response.send('error')
  }

})

router.get('/menu', async(req, response) => {
  /**
   * 菜单列表
   * 参数:  sid=xxx
  */
  let sid = req.query.sid
  let sqlStr = `select mname,mimg,mprice,mid from shop_menu where sid=${sid} and visibility=1`

  try {
    let { results } = await query(sqlStr)
    response.send(results)
  } catch(err) {
    console.log('------------------------此处有误' ,err)
    response.statusCode = 400
    response.statusMessage = 'error'
    response.send('error')
  }
})

router.post('/order/add', async(req, response) => {
  /**
   * 预定功能
   * 参数:  uid=xxx sid=xxx mid=xxxx time=xxx
   * 方法:  POST
   * 要求:  time 11点之前 
  */
  let sid = req.query.sid
  let uid = req.query.uid
  let mid = req.query.mid
  let time = req.query.time

  if (uid === -1) {
    log(req.session)
    return response.send('-1')
  }
  try {
    let { results: menus } = await query(`select mname,mprice from shop_menu where mid=${mid}`)
    let mname = menus[0].mname
    let price = menus[0].mprice

    let { results: users } = await query(`select unickname from user where uid=${uid}`)
    let uname = users[0].unickname
    
    let { results } = await query(`insert into shop_order(sid,uid,mid,mname,uname,price,time) values(${sid},${uid},${mid},'${mname}','${uname}',${price}, '${time}')`)
    if (results.affectedRows > 0) {
      response.send('1')
    } else {
      response.statusCode = 400
      response.send('0')
    }
    
  } catch(err) {
    console.log('------------------------此处有误' ,err)
    response.statusCode = 500
    response.statusMessage = 'error'
    response.send('error')
  }
})

/**
 * 一会删除掉
*/

router.post('/order/remove', urlencoded, async(req, response) => {
  /**
   * 取消预约。  // 一个小时之内才能 取消预约
  */
  let id = req.body.id
  let sqlStr = `delete from shop_order where _id=${id} and unix_timestamp()-unix_timestamp(time) <= 3600` 
  try {
    let { results } = await query(sqlStr)
    if (results.affectedRows > 0) {
      response.send('取消预约成功')
    } else {
      response.statusCode = 400
      response.send('时间超时，取消失败')
    }
  } catch(err) {
    console.log('------------------------此处有误---', err)
    response.statusCode = 500
    response.statusMessage = 'error'
    response.send('error')
  }
})

// 获取评论
router.get('/comment', async(req, response) => {
  let sid = req.query.sid
  let page = req.query.page || 1
  let num = req.query.num || 100

  try {
    let { results } = await query(`select unickname,uimg,imglist,score,content,time,response from (shop_comment left join user on shop_comment.uid=user.uid) where sid=${sid} order by time desc limit ${(page-1)*num}, ${num}`)
    let { results: counts } = await query(`select count(*) as total,sum(score>=4) as good,sum(score>=2 and score<4) as middle,sum(score>=0 and score<2) as bad from shop_comment where sid=${sid}`)
    let { total, good, middle, bad } = counts[0]

    for (let resultRow of results) {  // 此循环是用来做 参评人数的功能
      if (resultRow.imglist===null || resultRow.imglist.length ===2) {  // "[]"
        resultRow.imglist = null
      } else {
        resultRow.imglist = JSON.parse(resultRow.imglist)
      }
    }

    response.send({ total, good, middle, bad, list: results })
    log(results)
  } catch(err) {
    console.log('------------------------此处有误---', err)
    response.statusCode = 500
    response.statusMessage = 'error'
    response.send('error')
  }
})

// 提交评论
router.post('/comment', commentUpload.array('imglist', 4), async(req, response) => {
  let id = req.query.id            // 订单ID
  let sid = req.query.sid 
  let uid = req.query.uid  
  let score = req.body.score 
  let content = req.body.content || ''
  if (content.length >= 50) {
    response.statusCode = 400 // 客户端操作有误
    response.send('0')
  }

  try {
    let imglist = req.files.map( item => path.posix.join('/public/img/comment', item.filename) )
    imglist = JSON.stringify(imglist)

  
    await query(`insert into shop_comment(_id,sid,uid,score,content,imglist) values(${id},${sid},${uid},${score},'${content}','${imglist}')`)
    response.send('1')
    console.log(imglist)

  } catch(err) {
    console.log('------------------------此处有误---', err)
    response.statusCode = 500
    response.statusMessage = 'error'
    response.send('error')
  }
})

module.exports = router