/**
 * Created by chenkai on 16/6/5.
 */
function articleList(response) {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'debian-sys-maint',
        password : 'mlwkoTqE8leeqbL9',
        database : 'IOSBlogDB'
    });

    connection.connect(function(err) {
        if (err) {
            console.log('error connecting: ' + err.stack);
            return;
        }
        connection.query('select * from IOSBlogTable', function(err2, rows){
            if (err2){
                console.log(err2);
            }
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write('<head><meta charset="utf-8"/></head>');
            response.write(rows);
            response.end();
        });
    });


};


exports.articleList = articleList;
