/**
 * Created by chenkai on 16/6/5.
 */
function articleList(response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<head><meta charset="utf-8"/></head>');
    response.write('this is spider');
    response.end();
};


exports.articleList = articleList;
