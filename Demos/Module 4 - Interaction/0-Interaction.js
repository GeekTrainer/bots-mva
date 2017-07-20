var builder = require('botbuilder');
var restify = require('restify');
var githubClient = require('./github-client.js');

var connector = new builder.ChatConnector();
var bot = new builder.UniversalBot(
    connector,
    (session) => {
        session.endConversation(`Hi there! I'm the GitHub bot. I can help you find GitHub users.`);
    }
);

bot.dialog('search', [
    (session, args, next) => {
        if (session.message.text.toLowerCase() == 'search') {
            // TODO: Prompt user for text

        } else {
            var query = session.message.text.substring(7);
            next({ response: query });
        }
    },
    (session, result, next) => {
        var query = result.response;
        if (!query) {
            session.endDialog('Request cancelled');
        } else {
            githubClient.executeSearch(query, (profiles) => {
                var totalCount = profiles.total_count;
                if (totalCount == 0) {
                    session.endDialog('Sorry, no results found.');
                } else if (totalCount > 10) {
                    session.endDialog('More than 10 results were found. Please provide a more restrictive query.');
                } else {
                    session.dialogData.property = null;
                    var usernames = profiles.items.map(function (item) { return item.login });
                    
                    // TODO: Prompt user with list
                }
            });
        }
    }, (session, result, next) => {
        // TODO: Display final request
    }
]).triggerAction({
    matches: /^search/i
})

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());