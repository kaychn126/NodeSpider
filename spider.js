/**
 * Created by chenkai on 16/6/5.
 */
var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require("eventproxy"),
    mysql = require("mysql"),
    uuid = require("node-uuid"),
    schedule = require("node-schedule");
    config = require("./supportingFiles/config"),
    dbConfig = new config.dbConfig();

var pool = mysql.createPool({
    host     : dbConfig.dbhost,
    user     : dbConfig.dbuser,
    password : dbConfig.dbpassword,
    database : dbConfig.database
});

function startSpider(){
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(1,6)];
    rule.hour = 8;
    rule.minute = 0;
    var scheduleJob = schedule.scheduleJob(rule, function(){
        console.log("开始爬取博客");
        spiderBlogs();
    });
    //spiderBlogs();
};

function spiderBlogs(){
    tangQiaoBlogSpider();
};

function tangQiaoBlogSpider(){
    var pageList = [],//爬取网址列表
        articleList = [],//文章列表
        pageNum = 0,
        queryPageNum = 0;
    superagent.get('http://blog.devtang.com')
        .end(function(err,pres){
            if (!err) {
                var $ = cheerio.load(pres.text);
                //获取总页数
                pageNum = $('.space', '#page-nav').next().text();
                for(var i = 1; i<= pageNum; i++){
                    var pageUrl = 'http://blog.devtang.com/page/' + i + '/';
                    superagent.get(pageUrl)
                        .end(function(err,pres){
                            //console.log(pres.text);
                            queryPageNum++;
                            var $ = cheerio.load(pres.text);

                            var currentPageUrls = $('.post');
                            for(var j = 0; j < currentPageUrls.length; j++){
                                var article = {};
                                article.auther = '唐巧';
                                article.title = currentPageUrls.eq(j).find('a').attr('title');
                                article.url = 'http://blog.devtang.com' + currentPageUrls.eq(j).find('a').attr('href');
                                article.pubDate = currentPageUrls.eq(j).find('time').text();
                                articleList.push(article);
                                if (queryPageNum == pageNum && j == currentPageUrls.length-1) {
                                    insertArticleList(articleList);
                                }
                            }
                        });
                }
            } else {
                console.log("请求页面失败:" + err);
            }
        });
};

function insertArticleList(articleList){
    if (articleList.length!=0) {
        pool.getConnection(function(err, connection) {
            if (!err) {
                //批量插入
                //var blogData = [articleList.length];
                //for( var i = 0; i < articleList.length; i++){
                //    blogData[i] = [ articleList[i].auther, "" + articleList[i].title, "" + articleList[i].url, "" + articleList[i].pubDate];
                //}
                var insertNumber = 0;
                articleList.forEach(function(article){
                    insertNumber++;
                    connection.query('select * from IOSBlogTable where title=?', article.title, function(err, rows){
                        if (!err && (rows===null || rows.length===0)) {
                            connection.query('insert into IOSBlogTable set ?', article, function(error){
                                if (!error) {
                                    console.log('insert success!');
                                    if (insertNumber == articleList.length) {
                                        connection.release();
                                    }
                                }else{
                                    console.log(error.message);
                                    if (insertNumber == articleList.length) {
                                        connection.release();
                                    }
                                }
                            });
                        } else {
                            if (insertNumber == articleList.length) {
                                connection.release();
                            }
                        }
                    });
                });
            } else {
                console.log(err.message);
            }
        });
    }
};

exports.startSpider = startSpider;