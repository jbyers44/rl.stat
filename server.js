const express = require('express')
const app = express()
const bodyParser = require('body-parser');
//const sql = require('mssql')
const request = require('request')

/*
var dbConfig = {
  user: 'jbyers',
  password: 'rlstatpass!',
  server: 'PSML65609',
  database: 'rlstat',
  port: 1433,
  debug: true,
  options: {
    instanceName: 'SQLEXPRESS'
  }
}

function getEmp() {
  var conn = new sql.ConnectionPool(dbConfig);
  conn.connect().then(function () {
      var req = new sql.Request(conn);
      req.query("SELECT * FROM MatchStats WHERE PlatformId = 76561198438294275").then(function (recordset) {
          console.log(recordset);
          conn.close();
      })
      .catch(function (err) {
          console.log(err);
          conn.close();
      });        
  })
  .catch(function (err) {
      console.log(err);
  });
}

getEmp();
*/

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index');
})

app.get('/player', function (req, res) {
  res.render('error', {message: "Invald page, must submit a player request first"});
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

app.post('/player', function (req, res) {
  let usrIn = req.body.usrInput;
  let steam_ID = vanityToSteam(usrIn);
  console.log("steam id from vanity: " + steam_ID);
  if(steam_ID == null) {
    steam_ID = usrIn;
  }
  let profile = steamToProfile(steam_ID);
  if(profile == null) {
    res.render('error', {message: "Invalid steam ID or vanity url"});
  }
  else {
    let ranks = steamToStats(steam_ID);
    if(ranks == null) {
      res.render('player', {profile: profile, ranks: null, error: "Unable to get Rocket League statistics from Psyonix API"});
    }
    else {
      assignRankString(ranks);
      res.render('player', {profile: profile, ranks: ranks, error: null});
    }
  }
});

function steamToProfile(steam_ID) {
  let steamKey = '125C3420FDFF9B8E9675EA1D01F3BF18';
  let url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${steam_ID}`;
  console.log(url);
  request(url, function(err, response, body) {
    if(err)
    {
      return null;
    }
    else
    {
      let response = JSON.parse(body);
      console.log(response);
      var profile = [""];
      profile.name = response.response.players[0].personaname;
      profile.avurl = response.response.players[0].avatarfull;
      profile.link = response.response.players[0].profileurl;

      return profile;
    }
  });
}

function steamToStats(steam_ID) {
  let key = 'P5AIQRRDCYLFDOXZ0BKA1IE2S97REIFD';
  let url = `https://api.rocketleaguestats.com/v1/player?unique_id=${steam_ID}&platform_id=1`;
  var options = {
    url: url,
    headers: {
      Authorization: key
    }
  };
  request(options, function(err, response, body) {
    if(err || response == 404)
    {
      return null;
    }
    else
    {
      let response = JSON.parse(body);
      let standard = [response["rankedSeasons"]["8"]["13"]["rankPoints"], response["rankedSeasons"]["8"]["13"]["tier"], response["rankedSeasons"]["8"]["13"]["division"]];
      let doubles = [response["rankedSeasons"]["8"]["11"]["rankPoints"], response["rankedSeasons"]["8"]["11"]["tier"], response["rankedSeasons"]["8"]["11"]["division"]];
      let duel = [response["rankedSeasons"]["8"]["10"]["rankPoints"], response["rankedSeasons"]["8"]["10"]["tier"], response["rankedSeasons"]["8"]["10"]["division"]];
      let solo = [response["rankedSeasons"]["8"]["12"]["rankPoints"], response["rankedSeasons"]["8"]["12"]["tier"], response["rankedSeasons"]["8"]["12"]["division"]];
      let ranks = [standard, doubles, duel, solo];
      return ranks;
    }
  });
}

function vanityToSteam(player_ID) {
  
  let steamKey = '125C3420FDFF9B8E9675EA1D01F3BF18';
  let steamUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamKey}&vanityurl=${player_ID}`;
  request(steamUrl, function(err, response, body) {
    if(err)
    {
      return null;
    }
    else 
    {
      let response = JSON.parse(body);
      if(response.response.steamid == undefined)
      {
        return null;
      }
      else
      {
        let steam_ID = response.response.steamid;
        console.log(steam_ID);
        return steam_ID;
      }
    }
  });
}

function assignRankString(ranks) {
  for(let i of ranks)
  {
    switch(i[1])
    {
      case 0:
        i.rankString = "Unranked";
        break;
      case 1:
        i.rankString = "Bronze I";
        break;
      case 2:
        i.rankString = "Bronze II";
        break;
      case 3:
        i.rankString = "Bronze III";
        break;
      case 4:
        i.rankString = "Silver I";
        break;
      case 5:
        i.rankString = "Silver II";
        break;
      case 6:
        i.rankString = "Silver III";
        break;
      case 7:
        i.rankString = "Gold I";
        break;
      case 8:
        i.rankString = "Gold II";
        break;
      case 9:
        i.rankString = "Gold III";
        break;
      case 10:
        i.rankString = "Platinum I";
        break;
      case 11:
        i.rankString = "Platinum II";
        break;
      case 12:
        i.rankString = "Platinum III";
        break;
      case 13:
        i.rankString = "Diamond I";
        break;
      case 14:
        i.rankString = "Diamond II";
        break;
      case 15:
        i.rankString = "Diamond III";
        break;
      case 16:
        i.rankString = "Champion I";
        break;
      case 17:
        i.rankString = "Champion II";
        break;
      case 18:
        i.rankString = "Champion III";
        break;
      case 19:
        i.rankString = "Grand Champion";
        break;
    }
    i.rankString = "Division " + (i[2] + 1);
  }
}
