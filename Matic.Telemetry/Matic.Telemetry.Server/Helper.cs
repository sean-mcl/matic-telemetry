using MQTTnet;
using MQTTnet.Server;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

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
        ///     Sends the number of connected clients to "metrics/connected-nodes"
        /// </summary>
        /// <param name="server">IMqttServer</param>
        /// <returns>Task</returns>
        public static Task SendConnectedClients(IMqttServer server)
        {
            if (!server.IsStarted) return Task.CompletedTask;

            var sessionCount = server.GetSessionStatusAsync().Result.Where(s => !s.ClientId.StartsWith("client-")).Count();

            var message = new MqttApplicationMessageBuilder()
                .WithTopic("metrics/connected-nodes")
                .WithPayload(JsonSerializer.Serialize(new { data = new { count = sessionCount } }))
                .WithExactlyOnceQoS()
                .WithRetainFlag()
                .Build();

            server.PublishAsync(message, CancellationToken.None);

            return Task.CompletedTask;
        }

        /// <summary>
        ///     Sends the client status to "status/nodes/{clientId}"
        /// </summary>
        /// <param name="server">IMqttServer</param>
        /// <param name="clientId">string</param>
        /// <param name="active">bool</param>
        /// <returns>Task</returns>
        public static Task SendClientStatus(IMqttServer server, string clientId, bool active)
        {
            if (!server.IsStarted) return Task.CompletedTask;

            var message = new MqttApplicationMessageBuilder()
                .WithTopic($"status/nodes/{clientId}")
                .WithPayload(JsonSerializer.Serialize(new { data = new { isActive = active } }))
                .WithExactlyOnceQoS()
                .WithRetainFlag()
                .Build();

            server.PublishAsync(message, CancellationToken.None);
            return Task.CompletedTask;
        }
    }
}
