const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const sql = require('mssql')
const request = require('request-promise')


var dbConfig = {
  user: 'jbyers',
  password: 'rlstatpass!',
  server: 'PSML65609',
  database: 'rlstat',
  port: 1433,
  debug: 'true',
  options: {
    instanceName: 'SQLEXPRESS'
  }
}

function sqlCall(query) {
  var conn = new sql.ConnectionPool(dbConfig);
  var data;
  conn.connect().then(function () {
      var req = new sql.Request(conn);
      req.query(query).then(function (recordset) {
          console.log(recordset);
          data = recordset;
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
  return data;
}

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

app.post('/player', async function (req, res) {
  try {
    var player_ID = req.body.usrInput;
    var steam_ID = await vanityToSteam(player_ID);
    var data;
    if(steam_ID == null) {
      steam_ID = player_ID;
    }
    console.log(steam_ID);
    let profile = await steamToProfile(steam_ID);
    let ranks = null;
    if(profile !== null) {
      ranks = await steamToStats(steam_ID);
      data.matchStats = sqlCall("SELECT * FROM MatchStats WHERE PlatformId = " + steam_ID);
    }
    if(profile == null) {
      res.render('error', {message: "Failed to find a corresponding steam profile"});
    }
    else if(ranks == null) {
      res.render('error', {message: "Failed to locate valid statistics for the entered user in the Psyonix API"});
    }
    else {
      res.render('player', {profile: profile, ranks: ranks, data: data, error: null});
    }
  }
  catch (error) {
    console.error(error);
  }
});

async function vanityToSteam(player_ID) {
  let steamKey = '125C3420FDFF9B8E9675EA1D01F3BF18';
  let steamUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamKey}&vanityurl=${player_ID}`;
  var steam_ID = null;
  await request(steamUrl, function(err, response, body) {
    if(err) {
      return null;
    }
    else {
      let data = JSON.parse(body);
      if(data.response.success == 42) {
        return null;
      }
      steam_ID = data.response.steamid;    
    }
  });
  return steam_ID;
}

async function steamToProfile(steam_ID) {
  let steamKey = '125C3420FDFF9B8E9675EA1D01F3BF18';
  var profile = [""];
  let profileUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${steam_ID}`;
  await request(profileUrl, function(err, response, body) {
    if(err) {
      profile = null;
    }
    else {
      let data = JSON.parse(body);
      if(data.response.players.length == 0) {
        profile = null;
      }
      else {
        profile.name = data.response.players[0].personaname;
        profile.avurl = data.response.players[0].avatarfull;
        profile.link = data.response.players[0].profileurl;
      }
    }
  });
  return profile;
}

async function steamToStats(steam_ID) {
  let key = 'P5AIQRRDCYLFDOXZ0BKA1IE2S97REIFD';
  let url = `https://api.rocketleaguestats.com/v1/player?unique_id=${steam_ID}&platform_id=1`;
  var ranks = [""];
  var options = {
    url: url,
    headers: {
      Authorization: key
    }
  };
  await request(options, function(err, response, body, statusCode) {
    if(err || statusCode === 404 || response.statusCode == 404) {
      ranks = null;
    }
    else {
      let data = JSON.parse(body);
      console.log(data);
      let standard = [data["rankedSeasons"]["8"]["13"]["rankPoints"], data["rankedSeasons"]["8"]["13"]["tier"], data["rankedSeasons"]["8"]["13"]["division"]];
      let doubles = [data["rankedSeasons"]["8"]["11"]["rankPoints"], data["rankedSeasons"]["8"]["11"]["tier"], data["rankedSeasons"]["8"]["11"]["division"]];
      let duel = [data["rankedSeasons"]["8"]["10"]["rankPoints"], data["rankedSeasons"]["8"]["10"]["tier"], data["rankedSeasons"]["8"]["10"]["division"]];
      let solo = [data["rankedSeasons"]["8"]["12"]["rankPoints"], data["rankedSeasons"]["8"]["12"]["tier"], data["rankedSeasons"]["8"]["12"]["division"]];
      assignStrings([standard, doubles, duel, solo]);
      ranks = {standard: standard, doubles: doubles, duel: duel, solo: solo};  
    }
  });
  return ranks;
}


function assignStrings(ranks) {
  for(let i of ranks) {
    switch(i[1]) {
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
    i.divisionString = "Division " + (i[2] + 1);
  }
}
