var request = require('supertest');
var assert = require('assert');
var should = require('should');

const init_serv = require('../src/server/index.js');


var app;

    describe("API unit tests", function () {
        before(async ()=>{
            app = await init_serv();
        });
        it("shoud return default page", async function () {
            await request(app)
                .get('/')
                .expect(200);
        });
        it("/api/search should fail with empty credentials", async function () {
            var postdata = {
                twitterCreds: {
                    access_token: "",
                    access_secret: "",
                    query: "test_query"
                }
            };
            await request(app)
                .post('/api/search')
                .send(postdata)
                .expect(404);
        });


        it("get_balance should fail with wrong origin header", async () => {
            await request(app)
                .get('/api/webgold/get_balance')
                .expect(403, (res) => {
                    console.log(res);
                })
        });


        it("donate should work with credentials", async () => {
            console.log("*****get_balance start****");
            await request(app)
                .get('/api/webgold/donate')
                .expect(403)
        })
    });


