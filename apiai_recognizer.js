var apiai = require('apiai')
var dotenv = require('dotenv')
dotenv.config()

var app = apiai(process.env.APIAIAppId)

module.exports = {
    recognize: function(context, callback) {
        
        var request = app.textRequest(context.message.text, {
            sessionId: Math.random()
        });

        request.on('response', function(response) {
            var result = response.result;
            
            callback(null, {
                intent: result.metadata.intentName,
                score: result.score,
                result: result
            });
        });

        request.on('error', function(error) {
            callback(error);
        });

        request.end();
    }
}