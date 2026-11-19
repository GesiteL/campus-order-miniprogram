var fs = require('fs');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

// 统一读文件响应：错误返回 500，不再挂起（修复：原 err 分支无响应）
function sendFile(res, filename) {
    fs.readFile(filename, 'utf-8', function (err, data) {
        if (err) {
            console.error('read ' + filename + ' failed:', err.message);
            res.writeHead(500, {'Content-Type': 'application/json;charset=utf-8'});
            res.end(JSON.stringify({error: 1, message: 'read ' + filename + ' failed'}));
            return;
        }
        res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
        res.end(data);
    });
}

// 统一读文件并只取数组第 0 项（订单详情为静态示例数据）
function sendFirstItem(res, filename) {
    fs.readFile(filename, 'utf-8', function (err, data) {
        if (err) {
            console.error('read ' + filename + ' failed:', err.message);
            res.writeHead(500, {'Content-Type': 'application/json;charset=utf-8'});
            res.end(JSON.stringify({error: 1, message: 'read ' + filename + ' failed'}));
            return;
        }
        try {
            var list = JSON.parse(data);
            res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
            res.end(JSON.stringify(list[0] || {}));
        } catch (e) {
            // JSON 损坏时返回 500，避免回调抛异常导致进程退出
            console.error('parse ' + filename + ' failed:', e.message);
            res.writeHead(500, {'Content-Type': 'application/json;charset=utf-8'});
            res.end(JSON.stringify({error: 1, message: 'parse ' + filename + ' failed'}));
        }
    });
}

// 首页信息
app.get('/api/food/index', function (req, res) {
    sendFile(res, 'index.json');
});

// 菜单列表
app.get('/api/food/list', function (req, res) {
    sendFile(res, 'list.json');
});

// 订单列表（游标分页：last_id = 0 / 10 / 20）
app.get('/api/food/orderlist', function (req, res) {
    var filename = 'orderlist-0.json';
    if (req.query.last_id === "10") {
        filename = 'orderlist-10.json';
    } else if (req.query.last_id === "20") {
        filename = 'orderlist-20.json';
    }
    sendFile(res, filename);
});

// 下单（模拟接口：固定返回，不落库）
app.post("/api/food/order", function (req, res) {
    res.json({error: 0, order_id: 3});
});

// 订单详情（模拟接口：固定返回示例数据，忽略 order_id）
app.get("/api/food/order", function (req, res) {
    sendFirstItem(res, 'order.json');
});

// 支付（模拟接口：固定返回）
app.post("/api/food/pay", function (req, res) {
    res.json({error: 0, order_id: 3});
});

// 消费记录
app.get('/api/food/record', function (req, res) {
    sendFile(res, 'record.json');
});

app.listen(8081, function () {
    console.log('order server listening on http://127.0.0.1:8081');
});
