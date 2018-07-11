using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RLParseData
{
    class MatchData
    {
        public MatchData(string matchId, DateTime date, int teamSize, int team0Score, int team1Score, string matchType, string mapName)
        {
            MatchId = matchId;
            Date = date;
            TeamSize = teamSize;
            Team0Score = team0Score;
            Team1Score = team1Score;
            MatchType = matchType;
            MapName = mapName;
        }

        public string MatchId { get; set; }
        public DateTime Date { get; set; }
        public int TeamSize { get; set; }
        public int Team0Score { get; set; }
        public int Team1Score { get; set; }
        public string MatchType { get; set; }
        public string MapName { get; set; }
    }

    class MatchStats
    {
        public MatchStats(long platformId, int team, int score, int goals, int assists, int saves, int shots, uint carId, bool verdict, string matchId)
        {
            PlatformId = platformId;
            Team = team;
            Score = score;
            Goals = goals;
            Assists = assists;
            Saves = saves;
            Shots = shots;
            CarId = carId;
            Verdict = verdict;
            MatchId = matchId;
            FieldOfView = 0;
            Height = 0;
            Pitch = 0;
            Distance = 0;
            Stiffness = 0;
            SwivelSpeed = 0;
            TransitionSpeed = 0;
        }

        public MatchStats(long platformId, int team, int score, int goals, int assists, int saves, int shots, uint carId, bool verdict, string matchId, int fieldOfView, int height, int pitch, int distance, decimal stiffness, decimal swivelSpeed, decimal transitionSpeed)
        {
            PlatformId = platformId;
            Team = team;
            Score = score;
            Goals = goals;
            Assists = assists;
            Saves = saves;
            Shots = shots;
            CarId = carId;
            Verdict = verdict;
            MatchId = matchId;
            FieldOfView = fieldOfView;
            Height = height;
            Pitch = pitch;
            Distance = distance;
            Stiffness = stiffness;
            SwivelSpeed = swivelSpeed;
            TransitionSpeed = transitionSpeed;
        }

        public long PlatformId { get; set; }
        public int Team { get; set; }
        public int Score { get; set; }
        public int Goals { get; set; }
        public int Assists { get; set; }
        public int Saves { get; set; }
        public int Shots { get; set; }
        public uint CarId { get; set; }
        public bool Verdict { get; set; }
        public string MatchId { get; set; }
        public int FieldOfView { get; set; }
        public int Height { get; set; }
        public int Pitch { get; set; }
        public int Distance { get; set; }
        public decimal Stiffness { get; set; }
        public decimal SwivelSpeed { get; set; }
        public decimal TransitionSpeed { get; set; }
    }
}
