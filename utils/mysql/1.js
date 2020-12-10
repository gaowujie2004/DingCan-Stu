var mysql = require('mysql');

//准备创建增删改查四个方法
//现阶段只创建查询方法

//查询
var queryFn = function (sql,callback){
  //创建连接
  var connection = mysql.createConnection({
    user: 'root',
    password: 'root',
    database: 'project',
    timezone: 'Asia/Shanghai'
  });
  //连接数据库
  connection.connect();
  //使用query方法根据sql对数据库进行操作，在函数中处理数据，函数两个参数一个是错误，一个是数据本身
  connection.query(sql, callback)
}

module.exports = queryFn;