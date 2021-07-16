let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
let logger = require('morgan');



let loginRouter = require('./routes/login');
let tipRouter = require("./routes/tip");
let talkRouter = require("./routes/talk");
let profileRouter = require("./routes/profile");
let socketRouter = require("./routes/socket");
let manageRouter = require("./routes/manage");
let app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

//mongoose连接数据库
mongoose.connect("mongodb://127.0.0.1:27001/angler", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  function (err) {
    if (err) {
      throw err;
    }
    console.log("连接数据库成功");
  })


app.use((req, res, next) => {
  console.log("访问的主机host:", req.get("Host"));
  console.log("访问的主机Origin:", req.get("Origin"));
  console.log("访问的主机Referer:", req.get("Referer"));
  console.log("访问的originUrl:", req.originalUrl);
  next();
})

app.use(cookieParser())
app.all('*', function (req, res, next) {
  console.log("*****全局解决跨域app.all*****");

  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Cache-Control');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.header('Access-Control-Allow-Credentials', true);

  next();
})
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', loginRouter);

app.use('/tip', tipRouter);

app.use("/talk", talkRouter);

app.use("/profile", profileRouter);

app.use("/socket", socketRouter);

app.use("/manage", manageRouter);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log("服务端错误：", err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


let http = require("http").Server(app);


let sio = require("socket.io")(http, {
  cors: true
});

sio.on("connection", function (socket) {
  console.log("一个客户端连接了");
  socket.on("jjcc",(text)=>{
    socket.emit("accept",text);
    socket.emit("serverres",text+Math.random());
  })
})

http.listen(81, function () {
  console.log("express 服务启动在81端口");
})
module.exports = {
  http,
  sio
};