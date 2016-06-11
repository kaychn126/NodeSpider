/**
 * Created by chenkai on 16/6/5.
 */
function route(pathname, handle, request, response){
    if (typeof handle[pathname] === 'function') {
        var openuuid = request.headers['openuuid'];
        console.log('openuuid:' + openuuid);
        handle[pathname](request, response);
    } else {
        console.log("No request handler found for " + pathname);
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not found");
        response.end();
    }
};

exports.route = route;