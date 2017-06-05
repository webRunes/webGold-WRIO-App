import nconf from 'nconf';
import logger from 'winston';



function CORSDomainMatch(origin,domain) {
    domain = domain.replace(/\./g,'\\.')+'(:3033)?$';
    logger.log('silly',domain);
    return !!origin.match(new RegExp(domain,'m'));
}

export default function init_cors (app) {

    // Add headers
    app.use(function(request, response, next) {

        //console.log(request);
        let origin = request.get('origin');
        if (origin == undefined) origin = "";
        let workDomain = nconf.get("server:workdomain");

        if (CORSDomainMatch(origin,workDomain)) {
            response.setHeader('Access-Control-Allow-Origin', origin);
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

