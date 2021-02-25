using MQTTnet.AspNetCore;
using MQTTnet.Server;
using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     The MQTT Service
    /// </summary>
    public class MqttService : IDisposable, IMqttServerClientConnectedHandler, IMqttServerSubscriptionInterceptor, IMqttServerClientDisconnectedHandler, IMqttServerApplicationMessageInterceptor, IMqttServerConnectionValidator, IMqttServerStartedHandler
    {
        private IMqttServer mqtt;
        private readonly Regex nodeRegex = new Regex("metrics/categories/([^/]+)/nodes/([^/]+)");
        private readonly HttpClient client = new HttpClient();

        /// <inheritdoc>/>
        public void Dispose()
        {
            mqtt.Dispose();
            client.Dispose();
        }

        /// <summary>
        ///     Current state of the connected nodes.
        /// </summary>
        readonly ConcurrentDictionary<string, NodeState> nodeStates = new ConcurrentDictionary<string, NodeState>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        ///     Builds the MQTT Server options
        /// </summary>
        /// <param name="options">AspNetMqttServerOptionsBuilder</param>
        public void ConfigureMqttServerOptions(AspNetMqttServerOptionsBuilder options)
        {
            options
                .WithConnectionValidator(this)
                .WithApplicationMessageInterceptor(this)
                .WithSubscriptionInterceptor(this)
                .WithClientId("localhost")
                .WithStorage(new RetainedMessageHandler());
        }

        /// <summary>
        ///     Configures the mqtt server
        /// </summary>
        /// <param name="mqtt">IMqttServer</param>
        public void ConfigureMqttServer(IMqttServer mqtt)
        {
            this.mqtt = mqtt;
            mqtt.ClientConnectedHandler = this;
            mqtt.ClientDisconnectedHandler = this;
        }

        /// <summary>
        ///     Fired when a client connects
        /// </summary>
        /// <param name="eventArgs">MqttServerClientConnectedEventArgs</param>
        /// <returns>Task</returns>
        public Task HandleClientConnectedAsync(MqttServerClientConnectedEventArgs eventArgs)
        {
            // Ignore UI clients
            if (eventArgs.ClientId.StartsWith("client-")) return Task.CompletedTask;

            nodeStates.TryAdd(eventArgs.ClientId, null);
            Helper.Log(new LogMessage(LogSeverity.Info, nameof(MqttService), $"Connected to node {eventArgs.ClientId}"));
            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when a client disconnects
        /// </summary>
        /// <param name="eventArgs">MqttServerClientDisconnectedEventArgs</param>
        /// <returns>Task</returns>
        public Task HandleClientDisconnectedAsync(MqttServerClientDisconnectedEventArgs eventArgs)
        {
            // Ignore uncategorized nodes / UI clients
            if (!nodeStates.TryRemove(eventArgs.ClientId, out var state) || state == null) return Task.CompletedTask;

            Helper.Log(new LogMessage(LogSeverity.Info, nameof(MqttService), $"Disconnected from client {eventArgs.ClientId}"));
            state.IsActive = false;
            Helper.SendClientStatus(mqtt, eventArgs.ClientId, state).GetAwaiter().GetResult();
            Helper.SendConnectedClients(mqtt, nodeStates).GetAwaiter().GetResult();
            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when a messages was received
        /// </summary>
        /// <param name="context">MqttApplicationMessageInterceptorContext</param>
        /// <returns>Task</returns>
        public Task InterceptApplicationMessagePublishAsync(MqttApplicationMessageInterceptorContext context)
        {
            // White-Listing of Topics
            if (!(context.ApplicationMessage.Topic.StartsWith("metrics") || context.ApplicationMessage.Topic.StartsWith("status")))
            {
                context.AcceptPublish = false;
                Helper.Log(new LogMessage(LogSeverity.Warning, nameof(MqttService), $"Denied publish by {context.ClientId} with topic {context.ApplicationMessage.Topic}"));
                return Task.CompletedTask;
            }

            // If its a node message, cache the category of the client and send the status if its not set yet
            var match = nodeRegex.Match(context.ApplicationMessage.Topic);
            if (match.Success)
            {
                var category = match.Groups[1].Value;
                if (nodeStates.TryGetValue(context.ClientId, out var previousState) && previousState == null)
                {
                    var state = new NodeState
                    {
                        IsActive = true,
                        Category = category,
                        Location = Helper.GetLocation(client, mqtt, context.ClientId)
                    };

                    Helper.SendClientStatus(mqtt, context.ClientId, state).GetAwaiter().GetResult();
                    nodeStates[context.ClientId] = state;
                    Helper.SendConnectedClients(mqtt, nodeStates).GetAwaiter().GetResult();
                }
            }
            context.AcceptPublish = true;
            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when a client wants to connect
        /// </summary>
        /// <param name="context">MqttConnectionValidatorContext</param>
        /// <returns>Task</returns>
        public Task ValidateConnectionAsync(MqttConnectionValidatorContext context)
        {
            // TODO: White-/Black-Listing
            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when the mqtt server has started
        /// </summary>
        /// <param name="eventArgs">EventArgs</param>
        /// <returns>Task</returns>
        public Task HandleServerStartedAsync(EventArgs eventArgs)
        {
            Helper.Log(new LogMessage(LogSeverity.Info, nameof(MqttService), $"MQTT Server started."));

            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when a client wants to subscribe a topic
        /// </summary>
        /// <param name="context">MqttSubscriptionInterceptorContext</param>
        /// <returns>Task</returns>
        public Task InterceptSubscriptionAsync(MqttSubscriptionInterceptorContext context)
        {
            // Don't allow subscriptions to other topics than "metrics" or "status"
            if (!(context.TopicFilter.Topic.StartsWith("metrics") || context.TopicFilter.Topic.StartsWith("status")))
            {
                context.AcceptSubscription = false;
                Helper.Log(new LogMessage(LogSeverity.Warning, nameof(MqttService), $"Denied subscription by {context.ClientId} with topic {context.TopicFilter.Topic}"));
                return Task.CompletedTask;
            }
            context.AcceptSubscription = true;
            Helper.Log(new LogMessage(LogSeverity.Info, nameof(MqttService), $"Accepted subscription by {context.ClientId} with topic {context.TopicFilter.Topic}"));

            return Task.CompletedTask;
        }
    }
}