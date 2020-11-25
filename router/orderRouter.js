const express = require('express')
const path = require('path')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.get('/', async(req, response) => {
  let uid = req.query.uid
  let page = req.query.page || 1
  let num = req.query.num || 5

  try {
    let { results } = await query(`select _id as id,mname,price,time,shopname,scanteen as canteen from (shop_order left join shopkeeper on shop_order.sid=shopkeeper.sid) where uid=${uid} order by time desc limit ${(page-1)*num}, ${num}`)
    results.forEach(item => {
      let time = new Date(item.time)
      item.time = time.toLocaleString('chinese', { hour12:false })
      let isOk = Date.now()-time < (3*3600*1000)
      if (isOk) {
        item.isremove = true
      } else {
        item.isremove = false
      }
    })
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