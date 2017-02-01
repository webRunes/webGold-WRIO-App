import nconf from 'nconf';
import logger from 'winston';


export default function init_cors (app) {

    // Add headers
    app.use(function(request, response, next) {

        //console.log(request);
        var host = request.get('origin');
        if (host == undefined) host = "";

        var domain = nconf.get("server:workdomain");

        domain = domain.replace(/\./g,'\\.')+'$';
        logger.log('silly',domain);

        if (host.match(new RegExp(domain,'m'))) {
            response.setHeader('Access-Control-Allow-Origin', host);
            logger.log("debug","Allowing CORS for webrunes domains");
        } else {
            logger.log("debug",'host not match');
        }

        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        response.setHeader('Access-Control-Allow-Credentials', true);
        next();
    });
    return app;
};

