let express = require('express');
let router = express.Router();
const mongoose = require("mongoose");
const multiparty = require("multiparty");
var bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { resolve } = require('path');
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

//技巧类型
const tipClassModel = mongoose.model("tipClassify", new mongoose.Schema({
  className: String,
  essayCount: Number,
  iconClass: String
}), "tipClassify");

//技巧帖子
const tipEssayModel = mongoose.model("tipEssays", new mongoose.Schema({
  anglerId: String, //发布者Id
  anglerName: String, //发布者名字
  tipType: String,
  tipTitle: String,
  tipContent: String,
  tipImgArr: Array,
  anglerHasCollect:Boolean
}), "tipEssays");

//技巧帖子收藏
const collectTipModel = mongoose.model("collectTip", new mongoose.Schema({
  anglerId: String, //收藏者Id
  collectTipId: String
}), "collectTip");


//获取技巧类型
router.get("/tipClass", (req, res) => {
  tipClassModel.find({}).sort({
    essayCount: -1
  }).then((tipdata) => {
    // console.log(tipdata)：

    res.send(tipdata);
  }).catch((err) => {
    console.log("获取技巧类型失败", err);
  })
})

//根据id获取某个技巧类型
router.get("/getTipById", (req, res) => {
  let tId = req.query.tipId;
  tipClassModel.findById(tId).then((tipdata) => {
    // console.log(tipdata);

    res.send(tipdata);
  }).catch((err) => {
    console.log("获取某个技巧类型失败", err);
  })

})
//获取某种技巧类型的帖子列表
router.get('/tipEssays', (req, res) => {
  console.log("获取技巧帖子列表：", req.session.anglerId);
  if(!req.session.anglerId){
    res.send({
      err:1
    })
    return;
  }
  let tipName = req.query.tipName;

  tipEssayModel.find({
    tipType: tipName
  }, (err, data) => {
    if (err) {
      throw err;
    }
    let prosArr = [];
    for (let item of data) {
      let promise = new Promise((resolve) => {
        collectTipModel.find({
          anglerId: req.session.anglerId,
          collectTipId: item._id
        }).exec((err, collectdata) => {
          console.log("收藏：",  req.session.anglerId,item._id,collectdata);
          if (collectdata.length > 0) {
            item.anglerHasCollect =true;
          } else {
            item.anglerHasCollect =false;
          }
          resolve(item.anglerHasCollect);
        })
      })
      prosArr.push(promise);

    }
    Promise.all(prosArr).then((arr)=>{
      console.log("promiseAll res:",arr);
      res.send(data);
    })
    
  })
})

//用户发布tip
router.post("/addTipEssay", function (req, res) {
  console.log("发布者：", req.session.angler);
  console.log("发布者ID", req.session.anglerId);
  if (!req.session.angler) {
    return;
  }
  let form = new multiparty.Form();

  form.parse(req, function (err, fields, files) {
    console.log("用户发布技巧帖子,上传的fields：", fields);
    console.log("用户发布技巧帖子,上传的图片文件：", files);
    let fileLists = files.filelists;
    let prosAll = [];
    for (let fileobj of fileLists) {
      if(fileobj.size==0){
        continue;
      }
      console.log("正在读取文件:", fileobj.originalFilename);
      let fileTempNewName = String(Date.now()).substr(6) + fileobj.originalFilename;
      let newPath = path.join(__dirname, "../public/images", fileTempNewName);
      console.log("newPath", newPath);
      let ws = fs.createWriteStream(newPath);
      let rs = fs.createReadStream(fileobj.path);
      rs.pipe(ws);
      let pros = new Promise((resolve) => {
        ws.on("close", function () {
          resolve(fileTempNewName);
        }).on("error", (err) => {
          console.log("上传图片出错");
          res.send({
            errMsg: 0
          });
          throw err;
        })
      })
      prosAll.push(pros);
    }

    Promise.all(prosAll).then((resarr) => {
      console.log("成功上传了：" + resarr, typeof (resarr));
      return resarr;
    }).then((filearr) => {
      let newTipEssay = new tipEssayModel();
      newTipEssay.anglerId = req.session.anglerId;
      newTipEssay.anglerName = req.session.angler;
      newTipEssay.tipType = fields.tipType[0];
      newTipEssay.tipTitle = fields.tipTitle[0];
      newTipEssay.tipContent = fields.tipContent[0];
      newTipEssay.tipImgArr = filearr;
      newTipEssay.save((err, data) => {
        if (err) {
          console.log("发布技巧帖子失败");
          res.send({
            errMsg: 0
          })
          throw err;
        }
        updateClassCount(data);
        console.log("发布技巧帖子成功66666");
        res.send({
          errMsg: 1,
          data: data
        })

      })
    })

  });


})
//上传tip之后更新某种技巧类型的帖子数
function updateClassCount(da) {
  tipClassModel.find({
    className: da.tipType
  }).then((tipdata) => {
    let tipClassInstance = new tipClassModel();
    tipClassInstance = tipdata[0];
    tipClassInstance.essayCount = tipdata[0].essayCount + 1;
    tipClassInstance.save((err) => {
      if (err) {
        console.log("更新技巧类型帖子数失败");
        throw err;
      }
      console.log("更新技巧类型帖子数成功");
    });
  }).catch((err) => {
    console.log("查找技巧类型帖子失败", err);
  })
}





//用户收藏技巧帖子
router.post("/collectTip", bodyParser.json(), function (req, res) {
  console.log("收藏者:", req.session.angler);
  console.log(req.body);
  let collectAnglerId = req.body.anglerId;
  let collectTipId = req.body.tipId;
  let collect = new collectTipModel();
  collect.anglerId = collectAnglerId;
  collect.collectTipId = collectTipId;
  collect.save((err) => {
    if (err) {
      console.log("收藏失败");
      res.send({
        errMsg: 0
      })
      throw err;
    }
    res.send({
      errMsg: 1
    })
  })


})


//用户取消收藏
router.post("/cancelCollect",bodyParser.json(),function(req, res){
  let collectAnglerId = req.body.anglerId;
  let collectTipId = req.body.tipId;
  if(!collectAnglerId){
    res.send({
      err:1  
    })
  }

  collectTipModel.find({
    anglerId:collectAnglerId,
    collectTipId:collectTipId
  }).exec((err,collectres)=>{
    collectres[0].remove((err)=>{
      if(err){
        res.send({
          collectErr:1
        })
        throw err;
      }
      res.send({
        collectErr:0
      })
    })
  })

})


//获取用户收藏的内容
router.get("/anglerHasCollect",function(req,res){
  if(!req.session.anglerId){
    res.send({
      errMsg:1
    })
    return;
  }

  let anglerId=req.session.anglerId;
  collectTipModel.find({anglerId:anglerId}).exec((err,datalists)=>{
    if(err){
      throw err;
    }
    let prosArr=[];
    for(let collItem of datalists){
      let cId=collItem.collectTipId;
      let pse=new Promise((resolve)=>{
        tipEssayModel.findById(cId).exec((err,data)=>{
          resolve(data);
        })
      });
      prosArr.push(pse);
      
    }

    Promise.all(prosArr).then((resarr)=>{
      res.send(resarr);
    })
  })
})
module.exports = router;