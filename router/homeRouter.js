const express = require('express')
const path = require('path')
const { query } = require('../utils/mysql/mysqlPromise')
const { log } = require('console')

const router = express.Router()
router.get('/search', async(req, response) => {
  try {
    let text = req.query.text.trim()
    let page = req.query.page ?? 1
    let num = req.query.num ?? 10
    let dateObj = new Date()

    let { results } = await query(`select
          shop_category.sid,
          shop_category.content,
          shopname,
          scanteen,
          slogo,
          slogan,
          score
      from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid 
        left join (select sid,avg(score) as score from shop_comment group by sid) as avg on avg.sid=shopkeeper.sid) 
      where content like '%${text}%' or shopname like '%${text}%'
      group by sid limit ${(page-1)*num}, ${num}`)

    let { results: pages } = await query(`select shopkeeper.sid
        from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid) 
        where content like '%${text}%' or shopname like '%${text}%' group by sid`)
    pages = Math.ceil( pages.length / num )
    response.send({ results, pages })

    // 另外操作
    if (text !== '' && text !== null && text !== 'null' && text !== undefined && text !== 'undefined') {
      query(`insert into search values('${text}')`)
      console.log('存进去了.', text)
    }
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

    log(cate)
    
    if (canteen !== 'null' && canteen !== 'undefined' && canteen !== '' &canteen !== undefined) {
      log('进入  第一个IF', canteen)
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

    if (cate instanceof Array) {
      let whereStr = ''

      if (cate.length === 2) {
        whereStr = `where content like '%${cate[0]}%' or content like '%${cate[1]}%' or shopname like '%${cate[0]}%' or shopname like '$%{cate[1]}%'`
      }
      if (cate.length === 3) {
        whereStr = `where content like '%${cate[0]}%' or content like '%${cate[1]}%' or content like '%${cate[2]}%' or shopname like '%${cate[0]}%' or shopname like '%${cate[1]}%' or shopname like '%${cate[2]}%'`
      }

      log(whereStr)
      let { results } = await query(`select shop_category.sid,content,shopname,scanteen,slogo,slogan from (shop_category left join shopkeeper on shop_category.sid=shopkeeper.sid) ${whereStr} group by sid`)
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

    // cate => string
    log(cate)
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
    let page = req.query.page ?? 1
    let num = req.query.num ?? 10
    let dataObj = new Date()
    let year = dataObj.getFullYear()
    let month = req.query.month ?? dataObj.getMonth() + 1

    let { results } = await query(`
      select 
          mimg as img, 
          shop_menu.mname as name, 
          price, 
          slogan as logan,  
          shop_order.sid, 
          count(*) as ordernum
      from (
          shop_order left join shop_menu on shop_order.mid=shop_menu.mid 
          left join shopkeeper on shop_order.sid = shopkeeper.sid
        )
      where ${year}=year(time) and ${month}=month(time) 
      group by shop_menu.mid
      order by ordernum desc
      limit ${(page-1)*num},${num}`)

    let {results: pages} = await query(`select mid from shop_order where ${year}=year(time) and ${month}=month(time) group by mid`)
    pages = Math.ceil( pages.length/num )
    response.send({ pages, results })
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
    let pages

    let dateObj = new Date()
    let year = dateObj.getFullYear()
    let month = dateObj.getMonth() + 1

    if (order) {
      let obj = await query(`select 
      shop_category.sid,
      shop_category.content,
      shopname,
      scanteen,
      slogo,
      slogan,
      reserve,
      score
   from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid 
    left join (select sid, count(*) as reserve from shop_order where year(time)=${year} and month(time)=${month} group by sid) as test on test.sid=shopkeeper.sid 
    left join (select sid,avg(score) as score from shop_comment group by sid) as avg on avg.sid=shopkeeper.sid) 
   group by sid order by ${order} ${direction} limit ${(page-1)*num}, ${num}`)
      
      
      
      results = obj.results
      obj = null
    } else {
      let obj = await query(`select 
      shop_category.sid,
      shop_category.content,
      shopname,
      scanteen,
      slogo,
      slogan,
      reserve,
      score
    from (shopkeeper left join shop_category on shop_category.sid=shopkeeper.sid 
      left join (select sid, count(*) as reserve from shop_order where year(time)=${year} and month(time)=${month} group by sid) as test on test.sid=shopkeeper.sid 
      left join (select sid,avg(score) as score from shop_comment group by sid) as avg on avg.sid=shopkeeper.sid) 
    group by sid limit ${(page-1)*num}, ${num}`)
      results = obj.results
      obj = null
    }
    // 总页数
    let { results: nums } = await query(`select count(*) as nums from shopkeeper`)
    pages = Math.ceil(nums[0].nums / num)

    response.send({
      results,
      pages
    })
  } catch(err) {
    log('--------此处有误--------', err)
    response.statusCode = 500
    response.send('服务器有误!')
  }
})

module.exports = router