import * as React from 'react';
import Badge from '@material-ui/core/Badge';

class NodeBadge extends React.Component {
    constructor(props) {
        super(props);
        // Set the state
        this.state = { isConnected: false, status: [] };
    };

    // Generates a client ID
    static GenerateId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    // Called when table has been rendered
    componentDidMount() {

        // Create the mqtt client
        var mqtt = require('mqtt')
        var context = this;
        var options = {
            protocol: 'ws',
            clientId: `client-${NodeBadge.GenerateId(32)}`
        };
        var client = mqtt.connect(this.props.server, options)

        client.on('connect', function () {
            context.state.isConnected = true;
            client.subscribe(`status/nodes`);
        });

        client.on('reconnect', function () {
            context.state.isConnected = true;
            client.subscribe(`status/nodes`);
        });

        client.on('close', function () {
            context.state.isConnected = false;
            context.setState({ isConnected: false, status: [] });
        });

        client.on('message', function (topic, message) {
            if (context.state == null) {
                return;
            }
            context.setState({ status: JSON.parse(message) })
        });
    }

    componentWillUnmount() {
        if (this.client != null) {
            this.client.end();
        }
    }

    getCount() {
        var context = this;
        var nodeEntry = context.state.status.filter(function (item) { return item.category === context.props.category; })[0] || null;
        if (nodeEntry == null) {
            return 0;
        } else {
            return nodeEntry.count;
        }
    }

    render() {
        return (
            <Badge color="primary" badgeContent={this.getCount()}><span style={{ marginRight: "8px" }}>{this.props.label}</span></Badge>
        )
    }
}

export default NodeBadge;
