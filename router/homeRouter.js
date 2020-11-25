const express = require('express')
const path = require('path')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.get('/search', async(req, response) => {
  try {
    let text = req.query.text.trim()

    let { results } = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shop_category left join shopkeeper on shop_category.sid=shopkeeper.sid) where content like '%${text}%' or shopname like '%${text}%' group by sid`)
    for (let i=0; i<results.length; i++) {
      let resultRow = results[i]
      let sid = resultRow.sid 
      let { results: avgResults } = await query(`select avg(score) as score from shop_comment where sid=${sid}`)
      let { results: reserveResults } = await query(`select count(*) as reserve from shop_order where sid=${sid} and date(curdate())=date(time)`)
      resultRow.score = avgResults[0].score
      resultRow.reserve = reserveResults[0].reserve
    }
    response.send(results)

    // 另外操作
    query(`insert into search values('${text}')`)
  } catch(err) {
    log('--------此处有误--------', err)
    response.statusCode = 500
    response.send('服务器有误!')
  }
})

router.get('/hot', async(req, response) => {
  try {
    let { results } = await query(`select content,count(*) as num from search group by content order by num desc limit 4`)
    response.send(results)
  } catch(err) {
    log('--------此处有误--------', err)
    response.statusCode = 500
    response.send('服务器有误!')
  }
})

router.get('/category', async(req, response) => {
  /**
   * 学生版 - 首页 - 分类
  */
  try {
    let cate = req.query.cate 
    let canteen = req.query.canteen
    if (canteen) {
      let { results } = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid) where scanteen='${canteen}' group by sid`)
      for (let i=0; i<results.length; i++) {
        let resultRow = results[i]
        let sid = resultRow.sid 
        let { results: avgResults } = await query(`select avg(score) as score from shop_comment where sid=${sid}`)
        let { results: reserveResults } = await query(`select count(*) as reserve from shop_order where sid=${sid} and date(curdate())=date(time)`)
        resultRow.score = avgResults[0].score
        resultRow.reserve = reserveResults[0].reserve
      }
      response.send(results)
      return;
    }

    if (typeof cate !== 'string') {
      let totalResults = []
      for (let text of cate) {
        let { results } = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shop_category left join shopkeeper on shop_category.sid=shopkeeper.sid) where content like '%${text}%' or shopname like '%${text}%' group by sid`)
        for (let i=0; i<results.length; i++) {
          let resultRow = results[i]
          let sid = resultRow.sid 
          let { results: avgResults } = await query(`select avg(score) as score from shop_comment where sid=${sid}`)
          let { results: reserveResults } = await query(`select count(*) as reserve from shop_order where sid=${sid} and date(curdate())=date(time)`)
          resultRow.score = avgResults[0].score
          resultRow.reserve = reserveResults[0].reserve
        }
        totalResults.push(...results)
      }
      response.send(totalResults)
      return;
    }

    let { results } = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shop_category left join shopkeeper on shop_category.sid=shopkeeper.sid) where content like '%${cate}%' or shopname like '%${cate}%' group by sid`)
    for (let i=0; i<results.length; i++) {
      let resultRow = results[i]
      let sid = resultRow.sid 
      let { results: avgResults } = await query(`select avg(score) as score from shop_comment where sid=${sid}`)
      let { results: reserveResults } = await query(`select count(*) as reserve from shop_order where sid=${sid} and date(curdate())=date(time)`)
      resultRow.score = avgResults[0].score
      resultRow.reserve = reserveResults[0].reserve
    }
    response.send(results)

  } catch(err) {
    log('--------此处有误--------', err)
    response.statusCode = 500
    response.send('服务器有误!')
  }
})

router.get('/reservetop', async(req, response) => {
  try {
    let { results } = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid) group by sid limit 4`)
    for (let i=0; i<results.length; i++) {
      let resultRow = results[i]
      let sid = resultRow.sid 
      let { results: avgResults } = await query(`select avg(score) as score from shop_comment where sid=${sid}`)
      let { results: reserveResults } = await query(`select count(*) as reserve from shop_order where sid=${sid} and year(curdate())=year(time) and month(curdate())=month(time)`)
      resultRow.score = avgResults[0].score
      resultRow.reserve = reserveResults[0].reserve
    }
    // 排序
    results.sort((a, b) => b.reserve - a.reserve)
    results.forEach(item => {
      if (item.score!==null) {
        item.score = item.score.toFixed(1)
      }
    })
    response.send(results.slice(0,10))
  } catch (err) {
    log('--------此处有误--------', err)
    response.statusCode = 500
    response.send('服务器有误!')
  }
})

router.get('/shoplist', async(req, response) => {
  try {
    let page = req.query.page || 1
    let num = req.query.num  || 10
    let order = req.query.order
    let direction = req.query.direction || 'asc'
    let results
    if (order) {
      let obj = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid) group by sid order by ${order} ${direction} limit ${(page-1)*num}, ${num}`)
      results = obj.results
      obj = null
    } else {
      let obj = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid) group by sid limit ${(page-1)*num}, ${num}`)
      results = obj.results
      obj = null
    }
    
    // 以下是为了 添加   score \ 日预定量字段
    for (let i=0; i<results.length; i++) {
      let resultRow = results[i]
      let sid = resultRow.sid 
      let { results: avgResults } = await query(`select avg(score) as score from shop_comment where sid=${sid}`)
      let { results: reserveResults } = await query(`select count(*) as reserve from shop_order where sid=${sid} and date(curdate())=date(time)`)
      resultRow.score = avgResults[0].score
      resultRow.reserve = reserveResults[0].reserve
    }
    response.send(results)
  } catch(err) {
    log('--------此处有误--------', err)
    response.statusCode = 500
    response.send('服务器有误!')
  }
})

module.exports = router