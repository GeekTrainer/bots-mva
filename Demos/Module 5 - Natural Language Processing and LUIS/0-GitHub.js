const dotenv = require('dotenv');
dotenv.config();

const builder = require('botbuilder');
const restify = require('restify');
const githubClient = require('./github-client.js');

const connector = new builder.ChatConnector();
const bot = new builder.UniversalBot(
    connector,
    (session) => {
        session.endConversation(`Hi there! I'm the GitHub bot. I can help you find GitHub users.`);
    }
);

const recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
recognizer.onEnabled((context, callback) => {
    if(context.dialogStack().length > 0) callback(null, false);
    else callback(null, true);
})
bot.recognizer(recognizer);

bot.dialog('search', [
    (session, args, next) => {
        const query = builder.EntityRecognizer.findEntity(args.intent.entities, 'query');
        if(query) {
            next({ response: query.entity });
        } else {
            builder.Prompts.text(session, 'Who are you looking for?');
        }
    },
    (session, result, next) => {
        var query = result.response;
        if (!query) {
            session.endDialog('Request cancelled');
        } else {
            session.sendTyping();
            githubClient.executeSearch(query, (profiles) => {
                var totalCount = profiles.total_count;
                if (totalCount == 0) {
                    session.endDialog('Sorry, no results found.');
                } else if (totalCount > 10) {
                    session.endDialog('More than 10 results were found. Please provide a more restrictive query.');
                } else {
                    session.dialogData.property = null;
                    var usernames = profiles.items.map(function (item) { return item.login });
                    builder.Prompts.choice(session, 'What user do you want to load?', usernames, { listStyle: builder.ListStyle.button });
                }
            });
        }
    }, (session, result, next) => {
        session.sendTyping();
        githubClient.loadProfile(result.response.entity, (profile) => {
            var card = new builder.HeroCard(session);

            card.title(profile.login);

            card.images([builder.CardImage.create(session, profile.avatar_url)]);

            if (profile.name) card.subtitle(profile.name);

            var text = '';
            if (profile.company) text += profile.company + ' \n\n';
            if (profile.email) text += profile.email + ' \n\n';
            if (profile.bio) text += profile.bio;
            card.text(text);

            card.tap(new builder.CardAction.openUrl(session, profile.html_url));
            
            var message = new builder.Message(session).attachments([card]);
            session.endConversation(message);
        });    }
]).triggerAction({
    matches: 'SearchProfile'
})

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());