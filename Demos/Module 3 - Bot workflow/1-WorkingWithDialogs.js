const builder = require('botbuilder');
const restify = require('restify');

const connector = new builder.ChatConnector();
const bot = new builder.UniversalBot(
    connector,
    [
        (session) => {
            session.beginDialog('ensureProfile', session.userData.profile);
        },
        (session, results) => {
            const profile = session.userData.profile = results.response;
            session.endConversation(`Hello ${profile.name}. I love ${profile.company}!`);
        }
    ]
);

bot.dialog('ensureProfile', [
    (session, args, next) => {
        session.dialogData.profile = args || {};
        if(!session.dialogData.profile.name) {
            builder.Prompts.text(session, `What's your name?`);
        } else {
            next();
        }
    },
    (session, results, next) => {
        if(results.response) {
            session.dialogData.profile.name = results.response;
        }
        if(!session.dialogData.profile.company) {
            builder.Prompts.text(session, `What company do you work for?`);
        } else {
            next();
        }
    },
    (session, results) => {
        if(results.response) {
            session.dialogData.profile.company = results.response;
        }
        session.endDialogWithResult({ response: session.dialogData.profile });
    }
])

const server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(
    process.env.PORT || process.env.port || 3978,
    () => { console.log('Server up!') }
);