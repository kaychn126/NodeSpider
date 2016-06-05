var server = require("./server");
var router = require("./router");
var requestHandler = require("./requestHandler");
var spider = require("./spider");

var handle = {};
handle["/"] = requestHandler.articleList;
handle["/articleList"] = requestHandler.articleList;

server.start(router.route,handle);
spider.startSpider();