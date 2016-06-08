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
    moment = require("moment");
    config = require("./supportingFiles/config"),
    dbConfig = new config.dbConfig();


var pool = mysql.createPool({
    host     : dbConfig.dbhost,
    user     : dbConfig.dbuser,
    password : dbConfig.dbpassword,
    database : dbConfig.database
});

function startSpider(){
    //var rule = new schedule.RecurrenceRule();
    //rule.dayOfWeek = [0, new schedule.Range(1,6)];
    //rule.hour = 8;
    //rule.minute = 0;
    //var scheduleJob = schedule.scheduleJob(rule, function(){
    //    console.log("开始爬取博客");
    //    spiderBlogs();
    //});
    spiderBlogs();
};

function spiderBlogs(){
    //tangQiaoBlogSpider();
    //casaBlogSpider();
    //glowingSpider();
    blueBoxSpider();
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
                            article.createDate = new Date();
                            connection.query('insert into IOSBlogTable set ?', article, function(error){
                                if (!error) {
                                    console.log('insert success!');
                                }else{
                                    console.log(error.message);
                                }
                            });
                        }
                    });
                });
            } else {
                console.log(err.message);
            }
        });
    }
};

//唐巧博客
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

//    <ul id="fruits">
//    <li class="apple">Apple</li>
//    <li class="orange">Orange</li>
//    <li class="pear">Pear</li>
//    </ul>
//casa的博客
function casaBlogSpider(){
    var articleList = [];
    superagent.get('http://casatwy.com/archives.html')
        .end(function(err1, pres){
            if (!err1) {
                var $ = cheerio.load(pres.text);
                var articleNumber = $('#archives').find('a').length;
                for (var i = 0; i < articleNumber; i++) {
                    var article = {};
                    article.auther = 'Casa Taloyum';
                    article.title = $('#archives').find('a').eq(i).text();
                    article.url = $('#archives').find('a').eq(i).attr('href');
                    var date = new Date($('#archives').find('time').eq(i).attr('datetime'));
                    article.pubDate = moment(date).format("YYYY-MM-DD");
                    articleList.push(article);
                    if (i == articleNumber-1) {
                        insertArticleList(articleList);
                    }
                }
            }
        });
};

//glowing团队的博客
function glowingSpider(){
    var articleList = [];
    superagent.get('http://tech.glowing.com/cn/')
        .end(function(err1, pres1){
            if (!err1) {
                var $ = cheerio.load(pres1.text);
                var pageNumberString = $('.page-number').text();
                var pageNumber = parseInt(pageNumberString.slice(pageNumberString.length-1));
                var pageList = [];
                for (var i = 1; i <= pageNumber; i++) {
                    pageList.push('http://tech.glowing.com/cn/page/' + i + '/');
                }
                var queriedPageNumber = 0;//已经获取的页面数
                pageList.forEach(function(pageUrl){
                    superagent.get(pageUrl)
                        .end(function(err2, pres2){
                            queriedPageNumber++;
                            var $1 = cheerio.load(pres2.text);
                            for (var j = 0; j < $1('.content').find('article').length; j++) {
                                var article = {};
                                article.title = $1('.content').find('article').eq(j).find('h2').find('a').text();
                                article.url = 'http://tech.glowing.com' + $1('.content').find('article').eq(j).find('header').find('a').attr('href');
                                article.auther = $1('.content').find('article').eq(j).find('footer').find('a').eq(0).text();
                                article.headUrl = 'http://tech.glowing.com' + $1('.content').find('article').eq(j).find('footer').find('img').attr('src');
                                article.pubDate = $1('.content').find('article').eq(j).find('footer').find('time').attr('datetime');
                                articleList.push(article)
                                if (queriedPageNumber == pageNumber && j == $1('.content').find('article').length-1) {
                                    insertArticleList(articleList);
                                }
                            }
                        });
                });
            }
        });
};

function blueBoxSpider() {
    var articleList = [];
    superagent.get('https://blog.cnbluebox.com/blog/archives/')
        .end(function(err1, pres){
            if (!err1) {
                console.log(pres.text);
                var $ = cheerio.load(pres.text);
                for (var i = 0; i < $('.archives').length; i++) {
                    for (var j = 0; j < $('.archives').eq(i).find('article').length; j++) {
                        var article = {};
                        article.auther = "刘坤";
                        article.title = $('.archives').eq(i).find('article').eq(j).find('h1').find('a').text();
                        article.url = 'https://blog.cnbluebox.com' + $('.archives').eq(i).find('article').eq(j).find('h1').find('a').attr('href');
                        var date = new Date($('.archives').eq(i).find('article').eq(j).find('.meta').find('time').attr('datetime'));
                        article.pubDate = moment(date).format("YYYY-MM-DD");
                        article.headUrl = 'https://blog.cnbluebox.com' + $('.profilepic').find('img').attr('src');
                    }
                }
            }else {
                console.log(err1.message);
            }
        });
};

exports.startSpider = startSpider;