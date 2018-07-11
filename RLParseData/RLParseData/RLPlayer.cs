using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RLParseData
{
    class Player
    {
        public Player(long platformId, string platformName, string username, string avatar, int ranksId, int standard, int standardTier, int standardDiv, int doubles, int doublesTier, int doublesDiv, int duel, int duelTier, int duelDiv, int solo, int soloTier, int soloDiv)
        {
            PlatformId = platformId;
            PlatformName = platformName;
            Username = username;
            Avatar = avatar;
            RanksId = ranksId;
            Standard = standard;
            StandardTier = standardTier;
            StandardDiv = standardDiv;
            Doubles = doubles;
            DoublesTier = doublesTier;
            DoublesDiv = doublesDiv;
            Duel = duel;
            DuelTier = duelTier;
            DuelDiv = duelDiv;
            Solo = solo;
            SoloTier = soloTier;
            SoloDiv = soloDiv;
        }
        public Player(long platformId, string platformName, string username)
        {
            PlatformId = platformId;
            PlatformName = platformName;
            Username = username;
            Avatar = "Undefined";
            RanksId = 0;
            Standard = 0;
            StandardTier = 0;
            StandardDiv = 0;
            Doubles = 0;
            DoublesTier = 0;
            DoublesDiv = 0;
            Duel = 0;
            DuelTier = 0;
            DuelDiv = 0;
            Solo = 0;
            SoloTier = 0;
            SoloDiv = 0;
        }

        public long PlatformId { get; set; }
        public string PlatformName { get; set; }
        public string Username { get; set; }
        public string Avatar { get; set; }
        public int RanksId { get; set; }
        public int Standard { get; set; }
        public int StandardTier { get; set; }
        public int StandardDiv { get; set; }
        public int Doubles { get; set; }
        public int DoublesTier { get; set; }
        public int DoublesDiv { get; set; }
        public int Duel { get; set; }
        public int DuelTier { get; set; }
        public int DuelDiv { get; set; }
        public int Solo { get; set; }
        public int SoloTier { get; set; }
        public int SoloDiv { get; set; }
    }
}
