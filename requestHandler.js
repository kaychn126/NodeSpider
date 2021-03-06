/**
 * Created by chenkai on 16/6/5.
 */
var config = require("./supportingFiles/config");
var dbConfig = new config.dbConfig();
var mysql = require("mysql");
var url = require("url");

var pool = mysql.createPool({
    host: dbConfig.dbhost,
    user: dbConfig.dbuser,
    password: dbConfig.dbpassword,
    database: dbConfig.database
});

function articleList(request, response) {
    var query = url.parse(request.url,true).query;
    var pageNo = parseInt(query.pageNo);
    var pageNumber = parseInt(query.pageNumber);
    var pageBegin = (pageNo-1)*pageNumber;
    pool.getConnection(function(err, connection) {
        if (!err) {
            connection.query('select * from IOSBlogTable order by "pubDate" limit ?,?',[pageBegin, pageNumber], function(err2, rows){
                response.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
                if (err2){
                    response.write(err2.message);
                }else {
                    response.write(JSON.stringify(rows, "utf8"));
                }
                response.end();
                connection.release();
            });
        }
    });
};


exports.articleList = articleList;
