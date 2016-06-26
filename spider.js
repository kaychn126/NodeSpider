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
    guid = require("./spidertool");

var pool = mysql.createPool({
    host     : dbConfig.dbhost,
    user     : dbConfig.dbuser,
    password : dbConfig.dbpassword,
    database : dbConfig.database
});

function startSpider(){
    //每天12点和24点爬取文章
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(1,6)];
    rule.hour = [12,24];
    rule.minute = 0;
    var scheduleJob = schedule.scheduleJob(rule, function(){
        spiderBlogs();
    });
    //beyondvincentSpider();
};

function spiderBlogs(){
    var spiderList = [
        tangQiaoBlogSpider,
        casaBlogSpider,
        glowingSpider,
        oneVDenSpider,
        beyondvincentSpider
    ];

    //每间隔20秒爬取一个博客
    var count = 0;
    spiderList.forEach(function(handle){
        setTimeout(function(){
            handle();
        },count*20000);
        count++;
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
                articleList.forEach(function(article){
                    article.createDate = new Date();
                    connection.query('insert ignore into IOSBlogTable set ?', article, function(err4){
                        if (!err4) {
                        } else {
                            console.log(err4.message);
                        }
                    });
                });

                var autherList = [];
                for (var i = 0; i < articleList.length; i++) {
                    var article = articleList[i];
                    if (!containAuther(autherList, article)) {
                        var auther = {};
                        auther.autherId = guid.guid();
                        auther.autherName = article.auther;
                        auther.headUrl = article.headUrl;
                        autherList.push(auther);
                    }
                }

                autherList.forEach(function(auther){
                    connection.query('insert ignore into BlogAutherTable set ?', auther, function(err5){
                        if (err5) {
                            console.log('博主入库错误:' + err5.message);
                        }
                    });
                });

            } else {
                console.log(err.message);
            }
        });
    }
};

function containAuther(autherList, article){
    for (var i = 0; i < autherList.length; i++) {
        var auther = autherList[i];
        if (auther.autherName == article.auther) {
            return true;
        }
    }
    return false;
};

//唐巧博客
function tangQiaoBlogSpider(){
    console.log('tangQiaoBlogSpider');
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
                                article.headUrl = 'http://ww4.sinaimg.cn/small/65dc76a3jw8exkme9y57dj20yi0ymabn.jpg';
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

//casa的博客
function casaBlogSpider(){
    console.log('casaBlogSpider');
    var articleList = [];
    superagent.get('http://casatwy.com/archives.html')
        .end(function(err1, pres){
            if (!err1) {
                var $ = cheerio.load(pres.text);
                var articleNumber = $('#archives').find('a').length;
                for (var i = 0; i < articleNumber; i++) {
                    var article = {};
                    article.auther = 'Casa Taloyum';
                    article.headUrl = 'http://casatwy.com/pics/casa.png';
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
    console.log('glowingSpider');
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

//王巍的博客
function oneVDenSpider() {
    console.log('oneVDenSpider');
    var articleList = [];
    superagent.get('https://onevcat.com/#blog')
        .set({
            'User-Agent':       'Super Agent/0.0.1',
            'Content-Type':     'application/x-www-form-urlencoded'
        })
        .end(function(err1, pres1){
            if (!err1) {
                var $ = cheerio.load(pres1.text);
                var pns = $('.pagination__page-number').text();
                var pn = parseInt(pns.slice(pns.length-2));
                var pageList = [];
                for (var i = 1; i <= pn; i++) {
                    if (i == 1) {
                        pageList.push('https://onevcat.com/#blog');
                    } else {
                        pageList.push('https://onevcat.com/page/' + i + '/#blog');
                    }
                }

                var queriedPageN = 0;
                pageList.forEach(function(pageUrl){
                    superagent.get(pageUrl)
                        .end(function(err2, pres2){
                            queriedPageN++;
                            if (!err2) {
                                var $1 = cheerio.load(pres2.text);
                                for (var j = 0; j < $1('.post-list').find('li').length; j++){
                                    var article = {};
                                    article.auther = '王巍';
                                    article.title  = $1('.post-list').find('li').eq(j).find('h2').find('a').text();
                                    article.url = 'https://onevcat.com' + $1('.post-list').find('li').eq(j).find('h2')
                                            .find('a').attr('href');
                                    article.pubDate = $1('.post_list').find('li').eq(j).find('.post-list__meta').find('time').text();
                                    article.headUrl = 'https://onevcat.com' + $1('.blog-button').find('img').attr('src');
                                    articleList.push(article);
                                    if (queriedPageN == pn && j == $1('.post-list').find('li').length-1) {
                                        insertArticleList(articleList);
                                    }
                                }
                            }
                        });
                });
            }else {
                console.log(err1.message);
            }
        });
};

//破船之家
function beyondvincentSpider() {
    console.log("beyondvincentSpider");
    var articleList = [];
    superagent.get('http://beyondvincent.com/')
        .end(function(err1, pres1){
            var $ = cheerio.load(pres1.text);
            var pageNumber = parseInt($('#page-nav').find('.space').next().text());
            var pageList = [];
            for (var i = 1; i <= pageNumber; i++) {
                pageList.push('http://beyondvincent.com/page/' + i + '/');
            }

            var queryPageNumber = 0;
            pageList.forEach(function(pageUrl){
                superagent.get(pageUrl)
                    .end(function(err2, pres2){
                        if (!err2) {
                            queryPageNumber++;
                            var $1 = cheerio.load(pres2.text);
                            var articleNumber = $1('.mid-col').find('article').length;
                            for (var j = 0; j < articleNumber; j++) {
                                var article = {};
                                article.auther = '破船之家';
                                article.headUrl = 'https://avatars1.githubusercontent.com/u/3365146?v=3&s=460';
                                article.title = $1('.mid-col').find('article').eq(j).find('.article-title').text();
                                var date = new Date($1('.mid-col').find('article').eq(j).find('.article-date').find('time').attr('datetime'));
                                article.pubDate = article.pubDate = moment(date).format("YYYY-MM-DD");
                                article.url = 'https://avatars1.githubusercontent.com' + $1('.mid-col').find('article').eq(j).find('.article-title').attr('href');
                                articleList.push(article);
                                console.log(article);
                                if (queryPageNumber == pageNumber && j == articleNumber-1) {
                                    insertArticleList(articleList);
                                }
                            }
                        }
                    });
            });
        });
};

exports.startSpider = startSpider;