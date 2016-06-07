/**
 * Created by easybenefit on 16/6/7.
 */

function dbConfig(){
    this.dbhost = 'localhost';
    this.dbuser = 'root';
    this.dbpassword = 'kaychn1989';
    this.database = 'IOSBlogDB';
};

//public api
module.exports.dbConfig = dbConfig;