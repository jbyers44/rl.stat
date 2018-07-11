using System;
using System.IO;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RocketLeagueReplayParser;
using Newtonsoft;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Reflection;

namespace RLParseData
{
    class RLParseData
    {
        public static void ParseAndStore(string filepath)
        {
            string conStr = @"Data Source=PSML65609\SQLEXPRESS;Initial Catalog=rlstat;Integrated Security=True";
            RocketLeagueReplayParser.Replay replay = GetReplay(filepath);
            Tuple<List<MatchStats>, MatchData> parse = ExtractReplayData(replay);

            List<MatchStats> stats = parse.Item1;
            MatchData data = parse.Item2;
            ProcessMatchData(data, conStr);
            int i = 0;
            foreach(MatchStats entry in stats)
            {
                dynamic tmp = replay.Properties["PlayerStats"];
                string platformName = tmp[i]["Platform"].Value.Value;
                string username = tmp[i]["Name"].Value;
                Player tmpPlayer = new Player(entry.PlatformId, platformName, username);
                ProcessPlayer(tmpPlayer, conStr);
                ProcessMatchStats(entry, conStr);

                i++;
            }
        }

        public static Tuple<List<MatchStats>, MatchData> ExtractReplayData(RocketLeagueReplayParser.Replay repObj)
        {
            dynamic PlayerStats = repObj.Properties["PlayerStats"].Value;
            MatchData data = GetMatchData(repObj);
            List<long> IDS = new List<long>();
            for (int i = 0; i < PlayerStats.Count; i++)
            {
                long OnlineID = PlayerStats[i]["OnlineID"].Value;
                IDS.Add(OnlineID);
            }
            Dictionary<long, uint> CarIds = CarLookup(repObj, IDS);
            Dictionary<long, List<float>> CameraSettings = CameraLookup(repObj, IDS);
            
            List<MatchStats> PlayerStatList = GetMatchStats(PlayerStats, CarIds, CameraSettings, data);
            return Tuple.Create(PlayerStatList, data);
        }
        public static MatchData GetMatchData(RocketLeagueReplayParser.Replay repObj)
        {
            string MatchId = (string)repObj.Properties["Id"].Value;
            int TeamSize = (int)repObj.Properties["TeamSize"].Value;
            int Team0Score = 0;
            if(repObj.Properties.ContainsKey("Team0Score"))
            {
                Team0Score = (int)repObj.Properties["Team0Score"].Value;
            }
            int Team1Score = 0;
            if (repObj.Properties.ContainsKey("Team1Score"))
            {
                Team1Score = (int)repObj.Properties["Team1Score"].Value;
            }
            string MatchType = (string)repObj.Properties["MatchType"].Value;
            string MapName = (string)repObj.Properties["MapName"].Value;
            DateTime Date = DateTime.ParseExact((string)repObj.Properties["Date"].Value, "yyyy-MM-dd HH-mm-ss", null);
            Console.WriteLine(Date);
            MatchData header = new MatchData(MatchId, Date, TeamSize, Team0Score, Team1Score, MatchType, MapName);
            return header;
        }
        public static List<MatchStats> GetMatchStats(dynamic PlayerStats, Dictionary<long, uint> CarIds, Dictionary<long, List<float>> CameraSettings, MatchData data)
        {
            List<MatchStats> StatList = new List<MatchStats>();

            for (int i = 0; i < PlayerStats.Count; i++)
            {
                long PlatformId = PlayerStats[i]["OnlineID"].Value;
                int Team = PlayerStats[i]["Team"].Value;
                int Score = PlayerStats[i]["Score"].Value;
                int Goals = PlayerStats[i]["Goals"].Value;
                int Assists = PlayerStats[i]["Assists"].Value;
                int Saves = PlayerStats[i]["Saves"].Value;
                int Shots = PlayerStats[i]["Shots"].Value;
                bool Verdict = false;
                if (data.Team0Score > data.Team1Score && Team == 0 || data.Team0Score < data.Team1Score && Team == 1)
                {
                    Verdict = true;
                }
                uint CarId = CarIds[PlatformId];

                MatchStats temp;
                if (CameraSettings.ContainsKey(PlatformId))
                {
                    int FieldOfView = (int)CameraSettings[PlatformId][0];
                    int Height = (int)CameraSettings[PlatformId][1];
                    int Pitch = (int)CameraSettings[PlatformId][2];
                    int Distance = (int)CameraSettings[PlatformId][3];
                    decimal Stiffness = Math.Round((decimal)CameraSettings[PlatformId][4], 2);
                    decimal SwivelSpeed = Math.Round((decimal)CameraSettings[PlatformId][5], 2);
                    decimal TransitionSpeed = Math.Round((decimal)CameraSettings[PlatformId][6], 2);
                    temp = new MatchStats(PlatformId, Team, Score, Goals, Assists, Saves, Shots, CarId, Verdict, data.MatchId, FieldOfView, Height, Pitch, Distance, Stiffness, SwivelSpeed, TransitionSpeed);
                }
                else
                {
                    temp = new MatchStats(PlatformId, Team, Score, Goals, Assists, Saves, Shots, CarId, Verdict, data.MatchId);
                }
                StatList.Add(temp);
            }
            return StatList;
        }
        public static bool ProcessPlayer(Player player, string conStr)
        {
            using (SqlConnection con = new SqlConnection(conStr))
            {
                con.Open();
                if (player != null)
                {
                    DataTable toInsert = GetDataTable("dbo.tt_Players", conStr);
                    DataRow newRow = toInsert.NewRow();
                    foreach (DataColumn col in toInsert.Columns)
                    {
                        if (typeof(Player).GetProperty(col.ColumnName).GetValue(player) != null)
                        {
                            newRow[col] = typeof(Player).GetProperty(col.ColumnName).GetValue(player);
                        }
                    }
                    toInsert.Rows.Add(newRow);
                    SqlCommand cmd = new SqlCommand("usp_ProcessPlayers", con)
                    {
                        CommandType = CommandType.StoredProcedure
                    };
                    SqlParameter ttParam = cmd.Parameters.AddWithValue("@PlayersTT", toInsert);
                    ttParam.SqlDbType = SqlDbType.Structured;

                    cmd.ExecuteNonQuery();
                    return true;
                }
                return false;
            }
        }
        public static bool ProcessMatchStats(MatchStats stats, string conStr)
        {
            using (SqlConnection con = new SqlConnection(conStr))
            {
                con.Open();
                if (stats != null)
                {
                    DataTable toInsert = GetDataTable("dbo.tt_MatchStats", conStr);
                    DataRow newRow = toInsert.NewRow();
                    foreach (DataColumn col in toInsert.Columns)
                    {
                        if (typeof(MatchStats).GetProperty(col.ColumnName).GetValue(stats) != null)
                        {
                            newRow[col] = typeof(MatchStats).GetProperty(col.ColumnName).GetValue(stats);
                        }
                    }
                    toInsert.Rows.Add(newRow);
                    SqlCommand cmd = new SqlCommand("usp_ProcessMatchStats", con)
                    {
                        CommandType = CommandType.StoredProcedure
                    };
                    SqlParameter ttParam = cmd.Parameters.AddWithValue("@MatchStatsTT", toInsert);
                    ttParam.SqlDbType = SqlDbType.Structured;

                    cmd.ExecuteNonQuery();
                    return true;
                }
                return false;
            }
        }
        public static bool ProcessMatchData(MatchData data, string conStr)
        {
            using (SqlConnection con = new SqlConnection(conStr))
            {
                con.Open();
                if (data != null)
                {
                    DataTable toInsert = GetDataTable("dbo.tt_MatchData", conStr);
                    DataRow newRow = toInsert.NewRow();
                    foreach (DataColumn col in toInsert.Columns)
                    {
                        if (typeof(MatchData).GetProperty(col.ColumnName).GetValue(data) != null)
                        {
                            newRow[col] = typeof(MatchData).GetProperty(col.ColumnName).GetValue(data);
                        }
                    }
                    toInsert.Rows.Add(newRow);
                    SqlCommand cmd = new SqlCommand("usp_ProcessMatchData", con)
                    {
                        CommandType = CommandType.StoredProcedure
                    };
                    SqlParameter ttParam = cmd.Parameters.AddWithValue("@MatchDataTT", toInsert);
                    ttParam.SqlDbType = SqlDbType.Structured;

                    cmd.ExecuteNonQuery();
                    return true;
                }
                return false;
            }
        }

        public static RocketLeagueReplayParser.Replay GetReplay(string filepath)
        {
            return RocketLeagueReplayParser.Replay.Deserialize(filepath);
        }


        public static string CarDict(uint carId)
        {
            Dictionary<uint, string> carDict = new Dictionary<uint, string>()
            {
                { 21, "backfire" },
                { 22, "breakout" },
                { 23, "octane" },
                { 24, "paladin" },
                { 25, "roadhog" },
                { 26, "gizmo" },
                { 27, "sweettooth" },
                { 28, "xdevil" },
                { 29, "hotshot" },
                { 30, "merc" },
                { 31, "venom" },
                { 402, "takumi" },
                { 403, "dominus" },
                { 404, "scarab" },
                { 523, "zippy" },
                { 597, "delorean" },
                { 600, "ripper" },
                { 607, "grog" },
                { 625, "armadillo" },
                { 723, "hogsticker" },
                { 803, "newbat" },
                { 1018, "dominusgt" },
                { 1159, "xdevilmk2" },
                { 1171, "masamune" },
                { 1172, "marauder" },
                { 1286, "aftershock" },
                { 1295, "takumirxt" },
                { 1300, "roadhogxl" },
                { 1317, "esper" },
                { 1416, "breakouttypes" },
                { 1475, "proteus" },
                { 1478, "triton" },
                { 1533, "vulcan" },
                { 1568, "octanezsr" },
                { 1603, "twinmill3" },
                { 1623, "boneshaker" },
                { 1624, "endo" },
                { 1675, "icecharger" },
                { 1691, "mantis" },
                { 1856, "jager619" },
                { 1883, "imperator" },
                { 1919, "centio" },
                { 1932, "animus" },
                { 2070, "werewolf" },
                { 2268, "dodgecharger" },
                { 2269, "skyline" },
                { 2298, "samusgunship" },
                { 2313, "marionsr" },
                { 2665, "battumbler" },
                { 2666, "oldbat" },
            };
            return carDict[carId];
        }

        /**
        * Returns a blank DataTable that has columns with names/types identical to those in the SQL server.
        * These columns will be those of the table named named 'table' using the SqlConnection string 'conStr'
        **/
        public static DataTable GetDataTable(string table, string conStr)
        {
            DataTable dt;
            using (SqlConnection con = new SqlConnection(conStr))
            {
                con.Open();

                using (SqlCommand cmd = new SqlCommand("DECLARE @tt AS " + table + " SELECT * from @tt", con))
                {
                    cmd.CommandType = CommandType.Text;
                    dt = new DataTable();

                    dt.Load(cmd.ExecuteReader());
                }
            }
            return dt;
        }

        public static Dictionary<long, uint> CarLookup(RocketLeagueReplayParser.Replay rep, List<long> ids)
        {
            Dictionary<long, uint> CarIds = new Dictionary<long, uint>();
            long tmpId = 0;
            for(int i = 0; i < rep.Frames[0].ActorStates.Count; i++)
            {
                foreach(UInt32 key in rep.Frames[0].ActorStates[i].Properties.Keys)
                {
                    if(rep.Frames[0].ActorStates[i].Properties[key].PropertyName == "Engine.PlayerReplicationInfo:UniqueId")
                    {
                        dynamic uniqueTest = rep.Frames[0].ActorStates[i].Properties[key].Data;
                        Int64 steamId = uniqueTest.SteamID64;

                        if(!ids.Contains((long)steamId) || CarIds.ContainsKey(steamId))
                        {
                            break;
                        }
                        tmpId = steamId;
                    }

                    if (rep.Frames[0].ActorStates[i].Properties[key].PropertyName == "TAGame.PRI_TA:ClientLoadouts")
                    {
                        dynamic loadout = rep.Frames[0].ActorStates[i].Properties[key].Data;
                        uint carType = loadout.Loadout1.BodyProductId;
                        CarIds.Add(tmpId, carType);
                    }
                }
            }
            return CarIds;
        }
        public static Dictionary<long, List<float>> CameraLookup(RocketLeagueReplayParser.Replay rep, List<long> ids)
        {
            Dictionary<long, int> PlatformActor = PlatformIdActorId(rep, ids);
            Dictionary<int, List<float>> ActorCamera = ActorIdCamera(rep);
            List<long> BadPlatform = new List<long>();
            List<List<float>> BadCamera = new List<List<float>>();

            dynamic tmp = rep.Properties["PlayerStats"].Value;

            Dictionary<long, List<float>> PlatformCamera = new Dictionary<long, List<float>>();
            
            foreach (long key in PlatformActor.Keys)
            {
                if (ActorCamera.ContainsKey(PlatformActor[key]))
                {
                    PlatformCamera.Add(key, ActorCamera[PlatformActor[key]]);
                }
                else
                {
                    BadPlatform.Add(PlatformActor[key]);
                }
            }
            foreach(int key in ActorCamera.Keys)
            {
                if(!PlatformActor.ContainsValue(key))
                {
                    BadCamera.Add(ActorCamera[key]);
                }
            }
            if(PlatformCamera.Count != tmp.Count)
            {
                if (BadCamera.Count == 1 && BadPlatform.Count == 1)
                {
                    PlatformCamera.Add(BadPlatform[0], BadCamera[0]);
                }
            }
            return PlatformCamera;
        }
        public static Dictionary<long, int> PlatformIdActorId(RocketLeagueReplayParser.Replay rep, List<long> ids)
        {
            Dictionary<long, int> PlatformIdActorId = new Dictionary<long, int>();
            long tmpId = 0;
            for (int i = 0; i < rep.Frames[0].ActorStates.Count; i++)
            {
                foreach (UInt32 key in rep.Frames[0].ActorStates[i].Properties.Keys)
                {
                    if (rep.Frames[0].ActorStates[i].Properties[key].PropertyName == "Engine.PlayerReplicationInfo:UniqueId")
                    {
                        dynamic uniqueTest = rep.Frames[0].ActorStates[i].Properties[key].Data;
                        Int64 steamId = uniqueTest.SteamID64;

                        if (!ids.Contains((long)steamId) || PlatformIdActorId.ContainsKey(steamId))
                        {
                            break;
                        }
                        tmpId = steamId;
                    }

                    if (rep.Frames[0].ActorStates[i].Properties[key].PropertyName == "TAGame.PRI_TA:PersistentCamera")
                    {
                        dynamic id = rep.Frames[0].ActorStates[i].Properties[key].Data;
                        int ActorId = id.ActorId;
                        if(!PlatformIdActorId.ContainsValue(ActorId))
                        {
                            PlatformIdActorId.Add(tmpId, ActorId);
                        }
                    }
                }
            }
            return PlatformIdActorId;
        }
        public static Dictionary<int, List<float>> ActorIdCamera(RocketLeagueReplayParser.Replay rep)
        {
            Dictionary<int, List<float>> ActorIdCamera = new Dictionary<int, List<float>>();
            dynamic tmp = rep.Properties["PlayerStats"].Value;
            for(int i = 0; i < rep.Frames.Count; i++)
            {
                for(int j = 0; j < rep.Frames[i].ActorStates.Count; j++)
                {
                    foreach (UInt32 key in rep.Frames[i].ActorStates[j].Properties.Keys)
                    {
                        if (rep.Frames[i].ActorStates[j].Properties[key].PropertyName == "TAGame.CameraSettingsActor_TA:ProfileSettings")
                        {
                            List<float> CameraSettings = new List<float>();
                            dynamic settings = rep.Frames[i].ActorStates[j].Properties[key].Data;
                            CameraSettings.Add(settings.FieldOfView);
                            CameraSettings.Add(settings.Height);
                            CameraSettings.Add(settings.Pitch);
                            CameraSettings.Add(settings.Distance);
                            CameraSettings.Add(settings.Stiffness);
                            CameraSettings.Add(settings.SwivelSpeed);
                            CameraSettings.Add(settings.TransitionSpeed);

                            if (!ActorIdCamera.ContainsKey((int)rep.Frames[i].ActorStates[j].Id))
                            {
                                ActorIdCamera.Add((int)rep.Frames[i].ActorStates[j].Id, CameraSettings);
                            }
                            break;
                        }
                    }
                }
                if (ActorIdCamera.Count == tmp.Count)
                {
                    break;
                }   
            }
            return ActorIdCamera;
        }
    }
}
