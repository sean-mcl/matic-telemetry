using MQTTnet;
using MQTTnet.Server;
using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using System.Collections.Generic;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     Helper Class
    /// </summary>
    public static class Helper
    {
        /// <summary>
        ///     Logs a given message using colors.
        /// </summary>
        /// <param name="message"LogMessage></param>
        /// <returns>Task</returns>
        public static Task Log(LogMessage message)
        {
            switch (message.Severity)
            {
                case LogSeverity.Critical:
                    Console.ForegroundColor = ConsoleColor.Red;
                    break;

                case LogSeverity.Error:
                    Console.ForegroundColor = ConsoleColor.Red;
                    break;

                case LogSeverity.Warning:
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    break;

                case LogSeverity.Info:
                    Console.ForegroundColor = ConsoleColor.White;
                    break;

                case LogSeverity.Verbose:
                case LogSeverity.Debug:
                    Console.ForegroundColor = ConsoleColor.DarkGray;
                    break;
            }
            Console.WriteLine($"{DateTime.Now,-19} [{message.Severity,8}] {message.Source}: {message.Message} {message.Exception}");
            Console.ResetColor();

            return Task.CompletedTask;
        }

        /// <summary>
        ///     Gets the location of the IP address, if its possible, to resolve it.
        /// </summary>
        /// <param name="client">The HTTP client to use.</param>
        /// <param name="server">The MQTT server to use.</param>
        /// <param name="clientId">The ClientID, whom IP will be checked.</param>
        /// <returns>Location</returns>
        public static Location GetLocation(HttpClient client, IMqttServer server, string clientId, int retryCounter = 0)
        {
            var regex = new Regex(@"(\d+\.\d+\.\d+\.\d+):(\d+)");
            var match = regex.Match(server.GetClientStatusAsync().Result?.FirstOrDefault(s => s.ClientId == clientId)?.Endpoint ?? "");
            if (match.Success)
            {
                try
                {
                    return client.GetFromJsonAsync<Location>($"http://ip-api.com/json/{match.Groups[1].Value}").Result;
                }
                catch(Exception)
                {
                    if(retryCounter > 20)
                    {
                        // Wait a random amount of time (prevent API rate limits every 45s)
                        var wait = new Random().Next(10000, 45000);
                        Task.Delay(wait).GetAwaiter().GetResult();
                        return GetLocation(client, server, clientId, retryCounter++);
                    }
                    Log(new LogMessage(LogSeverity.Warning, nameof(GetLocation), "Exception while quering the location. The retry counter has reached the limit."));
                }
            }
            return null;
        }

        /// <summary>
        ///     Sends the number of connected clients per category.
        /// </summary>
        /// <param name="server">IMqttServer</param>
        /// <param name="states">IDictionary</param>
        /// <returns>Task</returns>
        public static Task SendConnectedClients(IMqttServer server, IDictionary<string, NodeState> states)
        {
            if (!server.IsStarted) return Task.CompletedTask;

            var response = states
                .Where(pair => pair.Value?.IsActive ?? false)
                .GroupBy(pair => pair.Value?.Category)
                .Select(group => new { category = group.Key, count = group.Count() }).ToList();

            response.Insert(0, new { category = "+", count = response.Sum(g => g.count) });

            var message = new MqttApplicationMessageBuilder()
                .WithTopic($"status/nodes")
                .WithPayload(JsonSerializer.Serialize(response))
                .WithExactlyOnceQoS()
                .WithRetainFlag()
                .Build();

            server.PublishAsync(message, CancellationToken.None).GetAwaiter().GetResult();

            return Task.CompletedTask;
        }

        /// <summary>
        ///     Sends the client status to "status/categories/{category}/nodes/{clientId}".
        /// </summary>
        /// <param name="server">IMqttServer</param>
        /// <param name="clientId">string</param>
        /// <param name="state">NodeState</param>
        /// <returns>Task</returns>
        public static Task SendClientStatus(IMqttServer server, string clientId, NodeState state)
        {
            if (!server.IsStarted) return Task.CompletedTask;

            if (clientId.StartsWith("client-") || string.IsNullOrWhiteSpace(clientId) || state == null || state.Category == null)
            {
                return Task.CompletedTask;
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic($"status/categories/{state.Category}/nodes/{clientId}")
                .WithPayload(JsonSerializer.Serialize(state))
                .WithExactlyOnceQoS()
                .WithRetainFlag()
                .Build();

            server.PublishAsync(message, CancellationToken.None).GetAwaiter().GetResult();
            return Task.CompletedTask;
        }
    }
}
