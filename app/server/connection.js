"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _mysql = require("mysql");

var _mysql2 = _interopRequireDefault(_mysql);

var nconf = require("./wrio_nconf.js");

var MYSQL_HOST = nconf.get("db:host");
var MYSQL_USER = nconf.get("db:user");
var MYSQL_PASSWORD = nconf.get("db:password");
var MYSQL_DB = nconf.get("db:dbname");
var DOMAIN = nconf.get("db:workdomain");

var db_config = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD
};

var connection;

connect();

exports["default"] = connection;

function connect() {
    connection = _mysql2["default"].createConnection(db_config);

    console.log("Connection:", "Connecting to data base...");
    connection.connect(function (err) {
        if (err) {
            console.log("Connection:", "Error during connecting to data base:", err.message);
            setTimeout(function () {
                console.log("Connection:", "Trying to reconnect...");
                connect();
            }, 2000);
        } else {
            console.log("Connection:", "Successfully connected to data base");
            connection.query("USE " + MYSQL_DB);
        }
    });

    connection.on("error", function (err) {
        console.log("Connection:", "Data base error: ", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.log("Connection:", "Trying to reconnect...");
            connect();
        }
    });
}
module.exports = exports["default"];