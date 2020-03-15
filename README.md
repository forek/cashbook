# 简易记账
一个简单的记账本应用

## 使用方法
### 1 - 获取项目源文件
```
git clone https://github.com/forek/cashbook.git
```

### 2.1 - 环境要求
操作系统：macOS 或 win10
Node.js版本：大于等于 v10
浏览器推：荐使用最新版本Chrome浏览器

### 2.2 - 安装依赖
yarn方式(推荐使用)：
```
yarn install
```

npm方式：
```
npm install
```

### 3 - 运行项目
```
npm run start
```

### 4 - 进入项目页面
等待至控制台显示 "-------- server started, listening port: 10300 --------" 后，
在本地浏览器中输入 "http://localhost:10300" 即可进入项目页面

### 5 - 导入数据
1. 点击“导入类型表”，选择“项目根目录/csv/categories.csv”文件上传
2. 点击“导入账单表”，选择“项目根目录/csv/bill.csv”文件上传

完成导入后即可正常使用