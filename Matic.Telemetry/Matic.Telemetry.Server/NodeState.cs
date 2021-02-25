using System.Text.Json.Serialization;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     Represents the state of a currently connected node.
    /// </summary>
    public class NodeState
    {
        /// <summary>
        ///     Gets or sets if the node is currently active.
        /// </summary>
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }

        /// <summary>
        ///     Gets or sets the node type.
        /// </summary>
        [JsonPropertyName("category")]
        public string Category { get; set; }

        /// <summary>
        ///     Gets or sets the current location of the node.
        /// </summary>
        [JsonPropertyName("location")]
        public Location Location { get; set; }
    }
}
