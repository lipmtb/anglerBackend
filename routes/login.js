let express = require('express');
let router = express.Router();
const mongoose = require("mongoose");
let bodyParser = require("body-parser");
const sessionmdl = require("express-session");


console.log("*********express router路由：login.js*********");


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




//用户
const userModel = mongoose.model("user", new mongoose.Schema({
    userName: String,
    userPsw: String
}), "user");


router.use(sessionmdl({
    name: 'jjcc',
    secret: 'abcdefg',
    cookie: {
        maxAge: 20 * 60 * 1000
    },
    resave: true, //强制会话保存，即使是未修改的
    saveUninitialized: true //强制未初始化的会话保存到存储
}));

//注册
router.post("/regist", bodyParser.json(), function (req, res) {
    console.log("正在注册");
    let username = req.body.username;
    let password = req.body.userpassword;
    console.log("用户名：", username);
    console.log("密码：", password);
    if (!username) {
        console.log("注册错误,用户名不存在");
        res.send({
            errMsg: 0
        })
        return;
    }
    let newAngler = new userModel();
    newAngler.userName = username;
    newAngler.userPsw = password;
    newAngler.save((err) => {
        if (err) {
            console.log("注册错误");
            res.send({
                errMsg: 0
            })
            throw err;
        }
        console.log("注册成功");
        res.send({
            errMsg: 1
        });

    })
})


//登录  ajax post是否带上cookie？是否属于同一个req.session会话？
//结论：ajax同域情况下也会自动加上cookie，也能属于同一个session会话
router.post("/login", bodyParser.json(), (req, res) => {
    let sess = req.session;
    let username = req.body.username;
    let password = req.body.userpassword;
    userModel.find({
        userName: username,
        userPsw: password
    }).exec((err, data) => {
        // console.log("数据库返回：", data);
        if (data.length === 0) { //登录失败
            res.send({
                errMsg: 0
            });
        } else { //登录成功
            sess.angler = username;
            sess.anglerId = data[0]._id;
            console.log(data[0]._id);
            res.send({
                errMsg: 1,
                anglerName: username
            });

        }
    })
})



//处理ajax 首页的判断是否登录
router.get("/login/isLogin", function (req, res) {
    let sess = req.session;

    console.log("is login ajax:", sess.angler);
    if (sess.angler) {
        res.send({
            loginState: 'login',
            anglerName: sess.angler,
            anglerId: sess.anglerId
        });
    } else {
        res.send({
            loginState: 'nologin'
        })
    }
})

//退出登录
router.get("/login/logout", function (req, res) {
    console.log("用户点击退出登录");
    req.session.destroy();
    res.send({
        state: 1,
        errmsg: 'user logout'
    })

})

module.exports = router;