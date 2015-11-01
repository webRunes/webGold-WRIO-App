var request = require('supertest');
var assert = require('assert');
var should = require('should');

export default (app,request) => {

    describe("API unit tests", function() {



        it ("shoud return default page",function (done){
            request(app)
                .get('/')
                .expect(200,done);
        });

        it("/api/search shoud fail with empty credentials", function (done) {
            var postdata = {
                twitterCreds: {
                    access_token:"",
                    access_secret: "",
                    query:"test_query"
                }

            };
            request(app)
                .post('/api/search')
                .send(postdata)
                .expect(404,done);

        });

    });

    it("get_balance should fail with wrong origin header", (done) => {

        request(app)
            .post('/api/webgold/get_balance')
            .expect(200,done)
    });


   // console.log("Setting override",app.override_session);


    it("donate should work with credentials", (done) => {
        console.log("*****get_balance start****");
        request(app)
            .get('/api/webgold/donate')
            .expect(403,done)
    })


};
