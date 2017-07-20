const builder = require('botbuilder');
const restify = require('restify');

const connector = new builder.ChatConnector();
const bot = new builder.UniversalBot(
    connector,
    (session) => {
        session.endConversation('Hello, Bot!');
    }
);

const server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(
    process.env.PORT || process.env.port || 3978,
    () => { console.log('Server up!') }
);