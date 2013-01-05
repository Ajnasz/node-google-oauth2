var request = require('request'),
	exec = require('child_process').exec,
	querystring = require('querystring');


module.exports =  function(opts) {
  if(!opts.redirect_uri){
    opts.redirect_uri = 'http://localhost:3000/callback'; 
  }

  var gAuth = {};

  var endpoint = 'https://accounts.google.com/o/oauth2/auth';
  
  /**
   * Constructs a google OAuth2 request url using the provided opts.
   * Spawns an http server to handle the redirect. Once user authenticates
   * and the server parses the auth code, the server process is closed
   * (Assuming the user has closed the window. For future, add redirect after
   * authentication to a page with instructions to close tab/window).
   */
  function getAuthCode(callback){
    var qs = {
      response_type: 'code',
      client_id: opts.client_id,
      redirect_uri: opts.redirect_uri,
      scope: 'https://www.googleapis.com/auth/userinfo.profile'	
    };
    
    var uri = '\''+endpoint + '?' + querystring.stringify(qs) +'\'';

    exec('open '+uri, function(err){
      if(err !== null){
        callback(err);
      }
      var server = require('http').createServer(function(req, res) {
        if(req.url.match(/callback/)) return parseCode(req, res)
      }).listen(3000);

      function parseCode(req,res){
        //for gdrive-cli:
        //instead of just closing the connection, redirect to an informational page
        server.close();

        //split url by ? so we just have the querystring left
        //extract out the auth code
        callback(null, querystring.parse(req.url.split('?')[1])['code']);
      }

    });
  }

  /**
   * Given the acquired authorization code and the provided opts,
   * construct a POST request to acquire the access token and refresh
   * token.
   *
   * @param {String} code The acquired authorization code
   */
  function getTokens(code, callback){
    var uri = 'https://accounts.google.com/o/oauth2/token';
    var form = {
      code : code,
      client_id : opts.client_id,
      client_secret: opts.client_secret,
      redirect_uri: opts.redirect_uri,
      grant_type: 'authorization_code'
    };

    request.post({url:uri, form: form}, function(err,req, body){
      if(err !== null){
        callback(err);
      }else{
        callback(null, JSON.parse(body));
      }
    });
  }

  gAuth.getAuthCode = getAuthCode;

  gAuth.getTokens = getTokens;

  //gAuth.refreshToken = refreshToken;

  return gAuth;

};
