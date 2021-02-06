using MQTTnet.AspNetCore;
using MQTTnet.Server;
using System;
using System.Threading.Tasks;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     The MQTT Service
    /// </summary>
    public class MqttService : IMqttServerClientConnectedHandler, IMqttServerSubscriptionInterceptor, IMqttServerClientDisconnectedHandler, IMqttServerApplicationMessageInterceptor, IMqttServerConnectionValidator, IMqttServerStartedHandler
    {
        private IMqttServer mqtt;

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
            Helper.Log(new LogMessage(LogSeverity.Info, nameof(MqttService), $"Connected to client {eventArgs.ClientId}"));
            Helper.SendConnectedClients(mqtt);
            Helper.SendClientStatus(mqtt, eventArgs.ClientId, true);
            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when a client disconnectes
        /// </summary>
        /// <param name="eventArgs">MqttServerClientDisconnectedEventArgs</param>
        /// <returns>Task</returns>
        public Task HandleClientDisconnectedAsync(MqttServerClientDisconnectedEventArgs eventArgs)
        {
            Helper.Log(new LogMessage(LogSeverity.Info, nameof(MqttService), $"Disconnected from client {eventArgs.ClientId}"));
            Helper.SendConnectedClients(mqtt);
            Helper.SendClientStatus(mqtt, eventArgs.ClientId, false);
            return Task.CompletedTask;
        }

        /// <summary>
        ///     Fired when a messages was received
        /// </summary>
        /// <param name="context">MqttApplicationMessageInterceptorContext</param>
        /// <returns>Task</returns>
        public Task InterceptApplicationMessagePublishAsync(MqttApplicationMessageInterceptorContext context)
        {
            if (!(context.ApplicationMessage.Topic.StartsWith("metrics") || context.ApplicationMessage.Topic.StartsWith("status")))
            {
                context.AcceptPublish = false;
                Helper.Log(new LogMessage(LogSeverity.Warning, nameof(MqttService), $"Denied publish by {context.ClientId} with topic {context.ApplicationMessage.Topic}"));
                return Task.CompletedTask;
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
        ///     Fired when the mqtt server started
        /// </summary>
        /// <param name="eventArgs">EventArgsparam>
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
