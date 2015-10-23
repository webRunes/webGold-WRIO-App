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

        it("shoud fail with empty credentials", function (done) {
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

    it("should fail to get_balance without credentials", (done) => {
        request(app)
            .post('/api/webgold/get_balance')
            .expect(403,done)
    });

    it("should fail to get_balance without credentials", (done) => {
        request(app)
            .post('/api/webgold/get_balance')
            .expect(403,done)
    })


};
