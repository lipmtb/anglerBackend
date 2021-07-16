let express = require('express');
let router = express.Router();

let bodyParser = require("body-parser");
const sessionmdl = require("express-session");


console.log("*********express router路由：login.js*********");
const {userModel}=require("../data/userModel.js");

router.use(sessionmdl({
    name: 'jjcc',
    secret: 'abcdefg',
    cookie: {
        maxAge: 20 * 60 * 1000,
        sameSite:'lax'
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
    let prosDup = null;
    if (username) {
        prosDup = new Promise((resolve) => {
            userModel.find({
                userName: username
            }).exec((err, data) => {
                if (data.length > 0) {
                    console.log("注册错误,用户名重复");
                    resolve(6);
                    res.send({
                        errMsg: 6
                    });
                    return;

                }
                resolve(1);
            })
        })
    }
    prosDup.then((nummsg) => {
        if (nummsg ==1) {
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
        }
    })



})


//登录  ajax post是否带上cookie？是否属于同一个req.session会话？
//结论：ajax同域情况下也会自动加上cookie，也能属于同一个session会话
router.post("/login", bodyParser.json(), (req, res) => {
    let sess = req.session;
    let username = req.body.username;
    let password = req.body.userpassword;
    console.log("登录中检查密码用户名",username,password);
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
                anglerName: username,
                anglerId:data[0]._id,
                userinfo:data[0]
            });

        }
    })
})



//处理ajax 首页的判断是否登录
router.get("/login/isLogin", function (req, res) {
    console.log("cookie",req.cookies);
    let sess = req.session;

    console.log("is login ajax:", sess);
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

//测试post
router.post("/login/testpost", bodyParser.urlencoded({extended:false}), (req, res) => {
    let sess = req.session;
    let username = req.body.username;
    let password = req.body.password;
    console.log("testpost登录中检查密码用户名",sess,username,password);
    res.send("<h1>你好"+username+"</h1>");
})


module.exports = router;