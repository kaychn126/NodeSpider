/**
 * Created by chenkai on 16/6/5.
 */
var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require("eventproxy"),
    mysql = require("mysql");

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'debian-sys-maint',
    password : 'mlwkoTqE8leeqbL9',
    database : 'IOSBlogDB'
});

function startSpider(){
    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('connected as id ' + connection.threadId);
    });
    tangQiaoBlogSpider();
};

function tangQiaoBlogSpider(){
    var pageList = [],//爬取网址列表
        articleList = [],//文章列表
        pageNum = 0;

    superagent.get('http://blog.devtang.com')
        .end(function(err,pres){
            if (!err) {
                var $ = cheerio.load(pres.text);
                //获取总页数
                pageNum = $('.space', '#page-nav').next().text();
                for(var i = 1; i<= pageNum; i++){
                    pageList.push('http://blog.devtang.com/page/' + i + '/');
                }
                //获取所有页面数据
                pageList.forEach(function(pageUrl){
                    superagent.get(pageUrl)
                        .end(function(err,pres){
                            //console.log(pres.text);
                            var $ = cheerio.load(pres.text);
                            var currentPageUrls = $('.post');
                            for(var i = 0; i < currentPageUrls.length; i++){
                                var article = {};
                                article.auther = '唐巧';
                                article.title = currentPageUrls.eq(i).find('a').attr('title');
                                article.url = 'http://blog.devtang.com' + currentPageUrls.eq(i).find('a').attr('href');
                                article.pubDate = currentPageUrls.eq(i).find('time').text();
                                connection.query('insert into IOSBlogTable set ?', article, function(error){
                                    if (error) {
                                        console.log(error.message);
                                    }
                                });
                                articleList.push(article);
                            }
                        });
                });
            } else {
                console.log("请求页面失败:" + err);
            }
        });
};

exports.startSpider = startSpider;