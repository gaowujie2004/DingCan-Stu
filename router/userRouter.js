var express = require('express');
var path = require('path');
var bodyParser=require('body-parser');
var router = express.Router();
var txt=bodyParser.urlencoded({extended:false})
var json = bodyParser.json()
var queryFn = require('../utils/mysql/1');

router.post('/login',txt,function(req,res){
	try {
		var uname = req.body.uname 
		var upwd = req.body.upwd
		var sqlStr = `select uid,uname,upwd from user where uname = '${uname}';`;
		queryFn(sqlStr,function(err,data){
			if(err){
				console.log('错误')
			}else{
				if (data.length <= 0) {
					// 没有这个账号 
					res.send('-1')
				} else {
  
					if(uname===data[0].uname && upwd===data[0].upwd){
              // OK
              req.session.isLogin = true
              req.session.uid = data[0].uid

              // 响应头 要放到 结束响应前面。。  —————— 忘记了。 
              res.send('1');
              
						}else if(uname!==data[0].uname || upwd!==data[0].upwd){
							res.send('0');
						}
				}
			}
		})
	} catch(err) {
		res.send(err)
	}
})

router.get('/sigincheck',function(req,res){
  var uname = req.query.uname
  queryFn(`select uname from user where uname='${uname}'`, function(err, datas) {
    if (err) {
      console.log('这里有误-------', err)
    } else {
      if (datas.length <= 0) {
        res.send('1')
      } else {
        res.statusCode = 400
        res.send('0')   // 用户名重复， 不能使用
      }
    }
    
  })
})

router.post('/sigin', json, function(req, res) {
  var uname = req.body.uname
  var upwd = req.body.upwd
  var unickname = req.body.unickname

  var sqlStr = `insert into user(uname, unickname, upwd) values('${uname}', '${unickname}', '${upwd}')`
  queryFn(sqlStr, function(err, results) {
    if (err) {
      res.statusCode = 400
      res.send('0')
      console.log(err)
    } else {
      try {
        res.send('1')
        // 注册成功
      } catch(err) {
        console.log('-----有误', err, req.session)
        res.statusCode = 400
        res.send('error')
      }
    }
  })
})

module.exports = router;