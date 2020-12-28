const express = require('express')
const path = require('path')
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

router.get('/all', async(req, response) => {
  let uid = req.query.uid
  let page = req.query.page || 1
  let num = req.query.num || 50

  let now = new Date() / 1000    // 要转成 mysql 的基于秒的时间戳
  try { 

    // 这里的  _id  应该是 订单ID  -  订单ID  和  评论表紧密相连
    let { results } = await query(`
    select
      shop_order.sid,
      shop_order._id as id,
      shop_menu.mname,
      price,
      shopname,
      scanteen as canteen ,
      shop_order.time,
      mimg,

      ${now}-unix_timestamp(shop_order.time) <= 10800 as isremove,
      shop_comment.time as iscomment
    from (
      shop_order left join shopkeeper on shop_order.sid=shopkeeper.sid left join
      shop_comment on shop_order._id = shop_comment._id left join
      shop_menu on shop_order.mid = shop_menu.mid)
    where shop_order.uid=${uid}
    order by time desc
    limit ${(page-1)*num},${num}`)

    
    response.send(results)
  } catch(err) {
    log('--------此处有误-------', err)
    response.statusCode = 500
    response.send('服务器错误')
  }
})

router.post('/remove', async(req, response) => {
  /**
   * 取消预约。  // 3小时之内才能 取消预约
  */
 let id = req.query.id
 let sqlStr = `delete from shop_order where _id=${id} and unix_timestamp()-unix_timestamp(time) <= 3600*3` 
 try {
   let { results } = await query(sqlStr)
   if (results.affectedRows > 0) {
     response.send('1')
   } else {
     response.statusCode = 400
     response.send('0')
   }
 } catch(err) {
   console.log('------------------------此处有误---', err)
   response.statusCode = 500
   response.statusMessage = 'error'
   response.send('error')
 }
})


module.exports = router