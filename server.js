const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const sql = require('mssql')
const request = require('request')

async () => {
  try {
      const pool = await sql.connect('mssql://jbyers:Tucketdog44!@localhost/database')
      const result = await sql.query`select * from MatchData`
      console.dir(result)
  } catch (err) {
      // ... error checks
  }
}

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index');
})

app.get('/player', function (req, res) {
  res.render('player', {standard: null, doubles: null, duel: null, solo: null, error: null });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

app.post('/player', function (req, res) {
  let player_Id = req.body.steamID;
  let steamKey = '125C3420FDFF9B8E9675EA1D01F3BF18';
  let steamUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamKey}&vanityurl=${player_Id}`;
  let steam_ID = null;
  console.log(steamUrl);
  request(steamUrl, function(err, response, body) {
    if(err)
    {
      res.render('player', {standard: null, doubles: null, duel: null, solo: null, error: "Invalid steam name" });
    }
    else 
    {
      let response = JSON.parse(body);
      if(response.response.steamid == undefined)
      {
        res.render('player', {standard: null, doubles: null, duel: null, solo: null, error: "Invalid steam name" });
      }
      else
      {
        let steam_ID = response.response.steamid;
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
            res.render('player', {standard: null, doubles: null, duel: null, solo: null, error: "404: Stats not found" });
          }
          else
          {
            let response = JSON.parse(body);
            let standard = [response["rankedSeasons"]["8"]["13"]["rankPoints"], response["rankedSeasons"]["8"]["13"]["tier"], response["rankedSeasons"]["8"]["13"]["division"]];
            let doubles = [response["rankedSeasons"]["8"]["11"]["rankPoints"], response["rankedSeasons"]["8"]["11"]["tier"], response["rankedSeasons"]["8"]["11"]["division"]];
            let duel = [response["rankedSeasons"]["8"]["10"]["rankPoints"], response["rankedSeasons"]["8"]["10"]["tier"], response["rankedSeasons"]["8"]["10"]["division"]];
            let solo = [response["rankedSeasons"]["8"]["12"]["rankPoints"], response["rankedSeasons"]["8"]["12"]["tier"], response["rankedSeasons"]["8"]["12"]["division"]];
            res.render('player', {standard: standard, doubles: doubles, duel: duel, solo: solo, error: null});
          }
        });
      }
    }
  });
})


