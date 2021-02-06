using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Globalization;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     Main Program
    /// </summary>
    public class Program
    {
        /// <summary>
        ///     Main Entry of the application
        /// </summary>
        /// <param name="args">string[]</param>
        public static void Main(string[] args)
        {
            CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;

            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false)
                .Build();
            BuildWebHost(args, config).RunAsync().GetAwaiter().GetResult();
        }

        /// <summary>
        ///     Builds the web host
        /// </summary>
        /// <param name="args">string[]</param>
        /// <param name="config">IConfiguration</param>
        /// <returns>IWebHost</returns>
        private static IWebHost BuildWebHost(string[] args, IConfiguration config) =>
            WebHost.CreateDefaultBuilder(args)
                .UseKestrel(o =>
                {
                    o.ListenAnyIP(int.TryParse(config.GetSection("Port")?.Value, out var port) ? port : 5000); // Default MQTT Port
                })
                .UseStartup<Startup>()
                .Build();
    }
}