var http = require("http");
var url = require("url");

function start(route,handle) {
  http.createServer(function (request, response) {
    var pathname = url.parse(request.url).pathname;
    route(pathname, handle, response);
  }).listen(8888);
  console.log("listen to 8888");
};

exports.start = start;

