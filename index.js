var restify = require('restify')
var botbuilder = require('botbuilder')

var server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} escuchando en ${server.url}`)
})

var connector = new botbuilder.ChatConnector({
    appId: '',
    appPassword: ''
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