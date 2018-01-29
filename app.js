/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var bb = require('botbuilder');
var botbuilder_azure = require('botbuilder-azure');
var apiaiRecognizer = require('./apiai_recognizer')
var Request = require('request')

// var dotenv = require('dotenv')
// dotenv.config()

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

// Create your bot with a function to receive messages from the user
// var bot = new bb.UniversalBot(connector);

// Receive messages from the user and respond
var bot = new bb.UniversalBot(connector, {
    persistConversationData: true
});

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

if (process.env['AzureWebJobsStorage']) {
    var tableName = 'botdata';
    var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
    var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
    bot.set('storage', tableStorage);
}

var intents = new bb.IntentDialog({
    recognizers: [
        apiaiRecognizer
    ],
    intentThreshold: 0.2,
    recognizeOrder: bb.RecognizeOrder.series
});

intents.onBegin(function (session, args, next) {
    session.sendTyping();
    next()
})


intents.matches('noticias', '/noticias')
intents.matches('saludo', '/saludo')
intents.matches('despedida', '/despedida')

// #region middleware
bot.use({
    botbuilder: function (session, next) {
        logMensajeEntrante(session, next)
    },
    send: function (event, next) {
        logMensajeSaliente(event, next);
    }
})
function logMensajeEntrante(session, next) {
    // console.log('Mensaje Entrante: ', session.message.text)
    next()
}
function logMensajeSaliente(event, next) {
    // console.log(event)
    // console.log(`Mensaje Saliente: ${event.text}`);
    next();
}
// #endregion

bot.dialog('/', intents)

bot.dialog('/saludo', [
    function (session, args, next) {
        var d = new Date();
        var h = d.getHours();
        let message = 'buenos días'
        let tiempo = 'este lindo día'
        if (h >= 12) {
            message = 'buenas tardes'
            tiempo = 'esta linda tarde'
        }
        if (h > 17) {
            message = 'buenas noches'
            tiempo = 'esta linda noche'
        }
        session.endDialog(`Hola muy ${message}, tengo noticias para ti, ¿sobre que quieres consultarme?`)
    },
])
bot.dialog('/despedida', [
    function (session, args, next) {
        session.endDialog(`Hasta luego, vuelve pronto, con gusto te atendere de nuevo`)
    },
])

bot.dialog('/cancelar', [
    function (session) {
        session.endDialog('No hay problemas, cancelo todo lo que estaba consultando para tí')
    }
]).triggerAction({ matches: /^cancelar$/i })

bot.dialog('/noticias', [
    function (session, args, next) {
        // console.log(args)
        // bb.Prompts.text(session, '¿Cómo te llamas?')

        // var reply = new bb.Message(session)
        //     .attachmentLayout(bb.AttachmentLayout.carousel)
        // .attachments(cards);
        // let temas = bb.EntityRecognizer.findAllEntities(args.result.parameters, 'tema');
        // console.log('**********************************************************')
        // console.log(temas)
        if (args.result.parameters.tema !== '') {
            let q = args.result.parameters.tema
            session.send(`Noticias más importantes sobre ${q}`);
            let url = `https://newsapi.org/v2/everything?q=${q}&language=es&sortBy=publishedAt&apiKey=94fb6272de0b4099ad76658b038b6e34`
            Request.get(url, (error, response, body) => {
                if (error) {
                    // return console.log(error);
                    console.log(error)
                    return session.endDialog(`Creo que no tengo noticias de ${q}, intenta con otra palabra!`);
                }
                let articulos = JSON.parse(body).articles
                // console.log(articulos);
                let tarjetas = []
                articulos.forEach(articulo => {
                    let titulo = articulo.title
                    let subtitulo = `Fecha: ${articulo.publishedAt}`
                    if (articulo.source.name) { subtitulo += ` - Fuente: ${articulo.source.name} ` }
                    if (articulo.source.author) { subtitulo += ` - Autor: ${articulo.source.author} ` }
                    let cuerpo = articulo.description
                    console.log(articulo.urlToImage);
                    let imagen = (articulo.urlToImage) ? articulo.urlToImage : `http://denrakaev.com/wp-content/uploads/2015/03/no-image-800x511.png`
                    let urlArticulo = articulo.url
                    let tarjeta = new bb.HeroCard(session)
                        .title(titulo)
                        .subtitle(subtitulo)
                        .text(cuerpo)
                        .images([
                            bb.CardImage.create(session, imagen)
                        ])
                        .buttons([
                            bb.CardAction.openUrl(session, urlArticulo, 'Saber más')
                        ])
                    tarjetas.push(tarjeta)
                });
                if (tarjetas.length > 0) {
                    let msj = new bb.Message(session)
                        .attachmentLayout(bb.AttachmentLayout.carousel)
                        .attachments(tarjetas)
                    session.endDialog(msj);
                } else {
                    session.endDialog(`Creo que no tengo noticias de ${q}, intenta con otra palabra!`);
                }
            });
            // session.endDialog(`Consultando noticias sobre ${args.result.parameters.tema}`);
        } else {
            session.endDialog(`No estoy leyendo bien, o estoy medio confundido, preguntame como si fuese niño de kinder`)
        }

    }
]);

intents.onDefault(function (session, args) {
    // session.sendTyping();
    session.send(args.result.fulfillment.speech)
})
