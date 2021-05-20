# anglerBackend
+ 后台mongodb,express

## 登录接口
+ /login 登录（method:post） data:username,userpassword
+ /login/isLogin (method:get)


## tip接口
+ /tip/tipClass(method:get)
+ /tip/getTipById (method:get) query(tipId)
+ /tip/tipEssays (method:get) qurery(tipName) 需要判断是否收藏过，所以先判断登录状态
+ /tip/addTipEssay (method:post)  前端formdata或者enctype=multipart/form-data

+ /tip/collectTip  (method:post,data:{anglerId,tipId})
+ /tip/cancelCollect(method:post,data:{anglerId,tipId})