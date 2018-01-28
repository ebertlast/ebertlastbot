/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var bb = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new bb.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new bb.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.dialog('/', [
    function (session, results, next) {
        session.sendTyping();
        setTimeout(function () {
            // session.send("Hello there...");
            bb.Prompts.text(session, '¿Cómo te llamas?')
        }, 3000);
    },
    function (session, results) {
        session.dialogData.nombre = results.response
        session.sendTyping();
        bb.Prompts.number(session, `Hola ${session.dialogData.nombre}, ¿que edad tienes?`)
    },
    function (session, results) {
        session.dialogData.edad = results.response
        session.sendTyping();
        bb.Prompts.time(session, '¿Que hora marca tu reloj?')
    },
    function (session, results) {
        session.dialogData.hora = bb.EntityRecognizer.resolveTime([results.response]);
        session.sendTyping();
        bb.Prompts.choice(session, '¿Cual prefieres?', 'Mar|Montaña', { listStyle: bb.ListStyle.button });
    },
    function (session, results) {
        session.dialogData.preferencia = results.response.entity
        session.sendTyping();
        bb.Prompts.confirm(session, '¿Deseas ver un resumen?', { listStyle: bb.ListStyle.button })
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(`Me comentaste que te llamas **${session.dialogData.nombre}**, que tienes **${session.dialogData.edad}** años, que tu reloj marca **${session.dialogData.hora}** y que prefieres **${session.dialogData.preferencia}**.`)
        } else {
            session.endDialog('Hasta luego')
        }
    }
    // function (session) {
    //     session.send(`appId: ${process.env.MicrosoftAppId}, appPassword: ${process.env.MicrosoftAppPassword}, openIdMetadata: ${process.env.BotOpenIdMetadata}`)
    //     session.send('You said ' + session.message.text);
    // }
]);

/*
var botbuilder = require('botbuilder')

var restify = require('restify')
var server = restify.createServer({
    name: 'ebertlastbot',
    // url: 'http://186.145.16.130'
})
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} escuchando en ${server.url}`)
})


var connector = new botbuilder.ChatConnector({
    // appId: '7d732b29-cabe-4800-9ec2-8a04341648a3',
    // appPassword: 'RKCYtj/l0X]&MF7['
})

var bot = new botbuilder.UniversalBot(connector)
server.post('/api/messages', connector.listen())

bot.dialog('/', [
    function (session, results, next) {
        session.sendTyping();
        setTimeout(function () {
            // session.send("Hello there...");
            botbuilder.Prompts.text(session, '¿Cómo te llamas?')
        }, 3000);
    },
    function (session, results) {
        session.dialogData.nombre = results.response
        session.sendTyping();
        botbuilder.Prompts.number(session, `Hola ${session.dialogData.nombre}, ¿que edad tienes?`)
    },
    function (session, results) {
        session.dialogData.edad = results.response
        session.sendTyping();
        botbuilder.Prompts.time(session, '¿Que hora marca tu reloj?')
    },
    function (session, results) {
        session.dialogData.hora = botbuilder.EntityRecognizer.resolveTime([results.response]);
        session.sendTyping();
        botbuilder.Prompts.choice(session, '¿Cual prefieres?', 'Mar|Montaña', { listStyle: botbuilder.ListStyle.button });
    },
    function (session, results) {
        session.dialogData.preferencia = results.response.entity
        session.sendTyping();
        botbuilder.Prompts.confirm(session, '¿Deseas ver un resumen?', { listStyle: botbuilder.ListStyle.button })
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(`Me comentaste que te llamas **${session.dialogData.nombre}**, que tienes **${session.dialogData.edad}** años, que tu reloj marca **${session.dialogData.hora}** y que prefieres **${session.dialogData.preferencia}**.`)
        } else {
            session.endDialog('Hasta luego')
        }
    }
])
*/