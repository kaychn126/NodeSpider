/**
 * Created by chenkai on 16/6/5.
 */
var config = require("./supportingFiles/config");
var dbConfig = new config.dbConfig();
var mysql = require("mysql");
var url = require("url");
var guid = require("./spidertool");

var pool = mysql.createPool({
    host: dbConfig.dbhost,
    user: dbConfig.dbuser,
    password: dbConfig.dbpassword,
    database: dbConfig.database
});

function route(pathname, handle, request, response){
    if (typeof handle[pathname] === 'function') {
        var openuuid = request.headers['openuuid'];
        pool.getConnection(function(err, connection){
            connection.query('select * from User where openudid=?', openuuid, function(err1, rows){
                if (!err1 && (rows===null || rows.length==0)) {
                    var user = {};
                    user.userId = guid.guid();
                    user.openudid = openuuid;
                    connection.query('insert into User set ?', user, function(err2){
                        if (err2) {
                            console.log(err2.message);
                        }
                    });
                }
            });
        });
        handle[pathname](request, response);
    } else {
        console.log("No request handler found for " + pathname);
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not found");
        response.end();
    }
};

exports.route = route;