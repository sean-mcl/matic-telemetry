using MQTTnet;
using MQTTnet.Server;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     Class used to handle retained messages.
    /// </summary>
    public class RetainedMessageHandler : IMqttServerStorage
    {
        private const string FilePath = "tmp//mqtt";
        private const string FileName = "RetainedMessages.json";
        private readonly string OutputPath;

        /// <summary>
        ///     ctor
        /// </summary>
        public RetainedMessageHandler()
        {
            OutputPath = Path.Combine(Directory.CreateDirectory(FilePath).FullName, FileName);
        }

        /// <summary>
        ///     Saves the current cached retained messages.
        /// </summary>
        /// <param name="messages">List of MqttApplicationMessage</param>
        /// <returns>Task</returns>
        public Task SaveRetainedMessagesAsync(IList<MqttApplicationMessage> messages)
        {
            File.WriteAllText(OutputPath, JsonSerializer.Serialize(messages));
            return Task.FromResult(0);
        }

        /// <summary>
        ///     Loads the saved retained messages.
        /// </summary>
        /// <returns>Task with messages</returns>
        public Task<IList<MqttApplicationMessage>> LoadRetainedMessagesAsync()
        {
            return Task.FromResult((IList<MqttApplicationMessage>)new List<MqttApplicationMessage>());
        }
    }
}