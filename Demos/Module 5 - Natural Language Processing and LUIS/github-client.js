var querystring = require('querystring');
var https = require('https');

module.exports = {
    executeSearch: function (query, callback) {
        this.loadData('/search/users?q=' + querystring.escape(query), callback);
    },

    loadProfile: function (username, callback) {
        this.loadData('/users/' + querystring.escape(username), callback);
    },

    loadData: function (path, callback) {
        var options = {
            host: 'api.github.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'sample-bot'
            }
        };
        var profile;
        var request = https.request(options, function (response) {
            var data = '';
            response.on('data', function (chunk) { data += chunk; });
            response.on('end', function () {
                callback(JSON.parse(data));
            });
        });
        request.end();
    }
}