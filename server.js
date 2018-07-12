const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const sql = require('mssql')
const request = require('request-promise')

var dict = {};
dict.carDict = {
  21: "Backfire",
  22: "Breakout",
  23: "Octane",
  24: "Paladin",
  25: "Roadhog",
  26: "Gizmo",
  27: "Sweet Tooth",
  28: "X-Devil",
  29: "Hotshot",
  30: "Merc",
  31: "Venom",
  402: "Takumi",
  403: "Dominus",
  404: "Scarab",
  523: "Zippy",
  597: "Delorean",
  600: "Ripper",
  607: "Grog",
  625: "Armadillo",
  723: "Hogsticker",
  803: "'16 Batmobile'",
  1018: "Dominus GT",
  1159: "X-Devil Mk2",
  1171: "Masamune",
  1172: "Marauder",
  1286: "Aftershock",
  1295: "Takumi RX-T",
  1300: "Roadhog XL",
  1317: "Esper",
  1416: "Breakout Type-S",
  1475: "Proteus",
  1478: "Triton",
  1533: "Vulcan",
  1568: "Octane ZSR",
  1603: "Twinmill III",
  1623: "Bone Shaker",
  1624: "Endo",
  1675: "Ice Charger",
  1691: "Mantis",
  1856: "Jager 619",
  1883: "Imperator DT5",
  1919: "Centio V17",
  1932: "Animus GP",
  2070: "Werewolf",
  2268: "Dodge Charger R/T",
  2269: "Skyline GT-R",
  2298: "Samus' Gunship",
  2313: "Mario NSR",
  2665: "TDK Tumbler",
  2666: "'89 Batmobile'",
}

dict.gmDict = {
  3: "Standard",
  2: "Doubles",
  1: "Solo",
}

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

async function sqlCall(query) {
  var conn = new sql.ConnectionPool(dbConfig);
  var data = {};
  await conn.connect().then(async function () {
      var req = new sql.Request(conn);
      await req.query(query).then(function (recordset) {
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
      conn.close();
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
    var data = [];
    var errMsg = null;
    if(steam_ID == null) {
      steam_ID = player_ID;
    }
    var profile = await steamToProfile(steam_ID);
    var ranks = null;
    if(profile !== null) {
      try {
        ranks = await steamToStats(steam_ID);
      }
      catch (error) {
        errMsg = "No ranked statistics found for the entered user.";
      }
      data.matchStats = await sqlCall("SELECT PlatformId, Team, Score, Goals, Assists, Saves, Shots, CarId, Verdict, MatchStats.MatchId, [Date], TeamSize, Team0Score, Team1Score, " +
                                      "MatchType, MapName, FieldOfView, Height, Pitch, Distance, Stiffness, SwivelSpeed, TransitionSpeed FROM MatchStats INNER JOIN MatchData ON MatchStats.MatchId = " +
                                      "MatchData.MatchId WHERE PlatformId = 76561198438818487 ORDER BY [Date] desc");
    }
    if(profile == null) {
      res.render('error', {message: "Failed to find a corresponding steam profile"});
    }
    else {
      if(ranks == null || ranks === undefined || ranks.length == 0)
      {
        ranks = null;
        errMsg = "no ranked statistics found for the entered user.";
      }
      res.render('player', {profile: profile, ranks: ranks, data: data, dict: dict, error: errMsg});
    }
  }
  catch (error) {
    console.error(error = "WE HAD AN ERROR");
    res.render('error', {message: errMsg});
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
      return profile;
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
  let apiKey = 'P5AIQRRDCYLFDOXZ0BKA1IE2S97REIFD';
  let url = `https://api.rocketleaguestats.com/v1/player?unique_id=${steam_ID}&platform_id=1`;
  var ranks = [];
  var options = {
    url: url,
    headers: {
      Authorization: apiKey
    }
  };
  await request(options, function(err, response, body, statusCode) {
    if(err || statusCode === 404 || response.statusCode == 404) {
      ranks = null;
    }
    else {
      let data = JSON.parse(body);
      if(data.hasOwnProperty('rankedSeasons')) {
        for(var key in data["rankedSeasons"]) {
          var modes = [];
          modes["season"] = key;
          if(data["rankedSeasons"][key].hasOwnProperty("13")) {
            var stats = [];
            stats["mode"] = "standard";
            stats.push(data["rankedSeasons"][key]["13"]["rankPoints"]);
            stats.push(data["rankedSeasons"][key]["13"]["tier"]);
            stats.push(data["rankedSeasons"][key]["13"]["division"]);
            modes.push(stats);
          }
          else {
            modes.push(null);
          }
          if(data["rankedSeasons"][key].hasOwnProperty("11")) {
            var stats = [];
            stats["mode"] = "doubles";
            stats.push(data["rankedSeasons"][key]["11"]["rankPoints"]);
            stats.push(data["rankedSeasons"][key]["11"]["tier"]);
            stats.push(data["rankedSeasons"][key]["11"]["division"]);
            modes.push(stats);
          }
          else {
            modes.push(null);
          }
          if(data["rankedSeasons"][key].hasOwnProperty("10")) {
            var stats = [];
            stats["mode"] = "duel";
            stats.push(data["rankedSeasons"][key]["10"]["rankPoints"]);
            stats.push(data["rankedSeasons"][key]["10"]["tier"]);
            stats.push(data["rankedSeasons"][key]["10"]["division"]);
            modes.push(stats);
          }
          else {
            modes.push(null);
          }
          if(data["rankedSeasons"][key].hasOwnProperty("12")) {
            var stats = [];
            stats["mode"] = "solo";
            stats.push(data["rankedSeasons"][key]["12"]["rankPoints"]);
            stats.push(data["rankedSeasons"][key]["12"]["tier"]);
            stats.push(data["rankedSeasons"][key]["12"]["division"]);
            modes.push(stats);
          }
          else {
            modes.push(null);
          }
          assignStrings(modes);
          ranks.push(modes);
        }
      }
    }
  });
  return ranks;
}

function assignStrings(ranks) {
  for(let i of ranks) {
    if(i != null) {
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
}

