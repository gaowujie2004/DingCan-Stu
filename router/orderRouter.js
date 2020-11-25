const express = require('express')
const path = require('path')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.get('/', async(req, response) => {
  let uid = req.query.uid
  try {
    let { results } = await query(`select _id,mname,price,time,shopname from (shop_order left join shopkeeper on shop_order.sid=shopkeeper.sid) where uid=${uid} order by time desc`)
    
    let newResults = []
    for (let resultRow of results) {
      let {
        shopname,
        _id: id,
        price,
        time,
        mname 
      } = resultRow
      let haveObj = newResults.find( (item={}) => item.shopname === resultRow.shopname )
      time = new Date(time).toLocaleString('chinese', { hour12:false })
      

      if (haveObj) {
        haveObj.list.push({ id, price, time, mname })
      } else {
        newResults.push({shopname, list:[{ id, price, time, mname }] })
      }
    }
    response.send(newResults)
  } catch(err) {
    log('--------此处有误-------', err)
    response.statusCode = 500
    response.send('服务器错误')
  }
})

router.post('/remove', async(req, response) => {
  let id = req.query.id
  try {

  } catch(err) {
    
  }
})
module.exports = router