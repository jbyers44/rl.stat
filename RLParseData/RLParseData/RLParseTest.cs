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
    class RLParseTest
    {
        public static void Main(string[] args)
        {
            string[] replays = Directory.GetFiles("C:/Users/jbyers/source/replays", "*.replay", SearchOption.AllDirectories);
            int i = 1;
            var watch = System.Diagnostics.Stopwatch.StartNew();
            foreach(string replay in replays)
            {
                Console.WriteLine("Processing replay #" + i + " (Filepath: " + replay + ").");
                RLParseData.ParseAndStore(replay);
                i++;
            }
            watch.Stop();
            Console.WriteLine("Parsed " + replays.Length + " replays in " + watch.ElapsedMilliseconds + " ms " + "(" + watch.ElapsedMilliseconds/1000 + " seconds).");
            Console.WriteLine("Average replay parsing/committing time: " + watch.ElapsedMilliseconds/replays.Length + " ms.");
        }
    }
}
