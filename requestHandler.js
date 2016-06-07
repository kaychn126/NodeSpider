/**
 * Created by chenkai on 16/6/5.
 */
//var config = require("./supportingFiles/config");
//var dbConfig = new config.dbConfig();
//var mysql = require("mysql");

function articleList(response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<head><meta charset="utf-8"/></head>');
    response.write('articleList');
    response.end();
    //var connection = mysql.createConnection({
    //    host     : dbConfig.dbhost,
    //    user     : dbConfig.dbuser,
    //    password : dbConfig.dbpassword,
    //    database : dbConfig.database
    //});
    //
    //connection.connect(function(err) {
    //    if (err) {
    //        console.log('error connecting: ' + err.stack);
    //        return;
    //    }
    //    connection.query('select * from IOSBlogTable order by "pubDate"', function(err2, rows){
    //        if (err2){
    //            console.log(err2);
    //        }
    //        response.writeHead(200, {'Content-Type': 'text/html'});
    //        response.write('<head><meta charset="utf-8"/></head>');
    //        response.write(JSON.stringify(rows));
    //        response.end();
    //    });
    //});
};


exports.articleList = articleList;
