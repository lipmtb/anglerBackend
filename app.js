var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var logger = require('morgan');

var loginRouter = require('./routes/login');
var tipRouter=require("./routes/tip");



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));


//全局中间件:解决所有路由的跨域问题
app.all('*',function (req,res,next) {
  console.log("*****全局解决跨域app.all*****");
  res.header('Access-Control-Allow-Origin','http://127.0.0.1:8079');
  res.header('Access-Control-Allow-Headers','X-Requested-With,Content-Type');
  res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 res.header('Access-Control-Allow-Credentials',true);
  
  next();
})

 
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', loginRouter);

app.use('/tip',tipRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log("服务端错误：",err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.listen(80,function(){
  console.log("express 服务启动");
})
module.exports = app;
