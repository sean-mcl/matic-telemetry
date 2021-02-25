import * as React from 'react';
import Grid from '@material-ui/core/Grid';
import UpdateIcon from '@material-ui/icons/Update';
import AccessTimeIcon from '@material-ui/icons/AccessTime';

import {SvgIcon } from '@material-ui/core';

class NodeMetadata extends React.Component {
    constructor(props) {
        super(props);
        // Set the state
        this.state = { rows: [], nodeStates: [] };
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

    CalculateLastTimestamp() {
        var now = Date.now();
        var max = Math.max.apply(Math, this.state.rows.map(function (r) { return Date.parse(r.timestamp); }));
        return now - max;
    }

    CalculateAveragePropagationTime() {
        return (this.state.rows.map((r) => r.blockPropagationTime).reduce((a, b) => a + b, 0) / this.state.rows.length) || 0;
    }

    GetLastBlock() {
        return Math.max.apply(Math, this.state.rows.map(function (r) { return r.blockNumber; }));
    }

    // Called when table has been rendered
    componentDidMount() {

        // Create the mqtt client
        var mqtt = require('mqtt')
        var context = this;
        var options = {
            protocol: 'ws',
            clientId: `client-${NodeMetadata.GenerateId(32)}`
        };
        var client = mqtt.connect(this.props.server, options)


        const nodeRegex = new RegExp(`metrics/categories/([^/]+)/nodes/([^/]+)`);
        const statusRegex = new RegExp(`status/categories/([^/]+)/nodes/([^/]+)`);

        client.on('connect', function () {
            context.state.isConnected = true;
            client.subscribe(`metrics/categories/${context.props.category}/nodes/+`);
            client.subscribe(`status/categories/${context.props.category}/nodes/+`);
            context.state.interval = setInterval(() => {
                context.setState((previousState) => ({ rows: previousState.rows }))
            }, 100);
        });

        client.on('reconnect', function () {
            context.state.isConnected = true;
            client.subscribe(`metrics/categories/${context.props.category}/nodes/+`);
            client.subscribe(`status/categories/${context.props.category}/nodes/+`);
            context.state.interval = setInterval(() => {
                context.setState((previousState) => ({ rows: previousState.rows }))
            }, 100);
        });

        client.on('close', function () {
            context.state.isConnected = false;
            clearInterval(context.interval);
            context.setState({ interval: null, rows: [] });
        });

        client.on('message', function (topic, message) {
            if (context.state == null) {
                return;
            }
            var payload = JSON.parse(message);

            // Status Message
            var statusMatch = statusRegex.exec(topic);
            if (statusMatch != null) {
                var nodeStatus = context.state.nodeStates.filter(function (item) { return item.id === statusMatch[2]; })[0] || null;
                if (nodeStatus != null && payload != null) {
                    nodeStatus.status = payload.isActive;
                } else {
                    context.state.nodeStates = [...context.state.nodeStates, { id: statusMatch[2], status: payload.isActive }];
                }
                return;
            }

            // Node Message
            var nodeMatch = nodeRegex.exec(topic);
            var nodeStatusElem = context.state.nodeStates.filter(function (item) { return item.id === nodeMatch[2]; })[0] || null;
            var nodeStatus = nodeStatusElem == null ? false : nodeStatusElem.status

            // Create a new row, which will be used for updates or additions
            var row = {
                id: nodeMatch[2],
                type: nodeMatch[1],
                timestamp: payload.dateTime,
                softwareVersion: payload.softwareVersion,
                peerCount: payload.peerCount,
                queueCount: payload.queueCount,
                softwareVersion: payload.softwareVersion,
                blockNumber: payload.blockNumber,
                blockHash: payload.blockHash,
                blockTime: payload.blockTime,
                blockPropagationTime: payload.blockPropagationTime
            };

            // Initialize if necessary
            if (context.state.rows == null || context.state.rows.length == 0) {
                context.state.rows = [row];
            }
            else {
                // Check if there is an existing row to update
                var nodeRow = context.state.rows.filter(function (item) { return item.id === nodeMatch[2]; })[0] || null;

                // If so, update the row
                if (nodeRow != null) {
                    nodeRow.id = nodeMatch[2];
                    nodeRow.type = nodeMatch[1];
                    nodeRow.timestamp = payload.dateTime;
                    nodeRow.softwareVersion = payload.softwareVersion;
                    nodeRow.peerCount = payload.peerCount;
                    nodeRow.queueCount = payload.queueCount;
                    nodeRow.blockNumber = payload.blockNumber;
                    nodeRow.blockHash = payload.blockHash;
                    nodeRow.blockTime = payload.blockTime;
                    nodeRow.blockPropagationTime = payload.blockPropagationTime;
                }
                // Otherwise create a new row
                else {
                    context.state.rows = [...context.state.rows, row];
                }
            }
        });

    }

    componentWillUnmount() {
        // Clear the refresh interval of the UI and the MQTT Client
        clearInterval(this.interval);
        if (this.client != null) {
            this.client.end();
        }
    }

    render() {
        return (
            <Grid
                container
                direction="row"
                justify="space-evenly"
                alignItems="center"
                style={{ backgroundColor: "#2891F9", height: "14vh", overflow: "auto", whiteSpace: "nowrap" }}
            >
                <Grid item m={3}>
                    <div style={{ display: "inline-block" }} >
                        <UpdateIcon style={{ fontSize: "5.5vh", margin: "auto" }} ></UpdateIcon>
                    </div>
                    <div style={{ display: "inline-block", marginLeft: "1vw", verticalAlign: "top" }} >
                        <span style={{ fontSize: "2vh" }}>LAST UPDATE</span><br />
                        <span style={{ fontSize: "2vh" }}>{(this.CalculateLastTimestamp() / 1000).toLocaleString()}s ago</span>
                    </div>
                </Grid>
                <Grid item m={3}>
                    <div style={{ display: "inline-block" }} >
                        <SvgIcon viewBox="0 0 512 512" style={{ color: "white", fontSize: "5vh" }}>
                            <g>
                                <g>
                                    <path d="M256,0L31.528,112.236v287.528L256,512l224.472-112.236V112.236L256,0z M234.277,452.564L74.974,372.913V160.81
			l159.303,79.651V452.564z M101.826,125.662L256,48.576l154.174,77.087L256,202.749L101.826,125.662z M437.026,372.913
			l-159.303,79.651V240.461l159.303-79.651V372.913z"/>
                                </g>
                            </g>
                        </SvgIcon>
                    </div>
                    <div style={{ display: "inline-block", marginLeft: "1vw", verticalAlign: "top" }} >
                        <span style={{ fontSize: "2vh" }}>LAST BLOCK</span><br />
                        <span style={{ fontSize: "2vh" }}>#{this.GetLastBlock().toLocaleString()}</span>
                    </div>
                </Grid>
                <Grid item m={3}>
                    <div style={{ display: "inline-block" }} >
                    <AccessTimeIcon style={{ fontSize: "5.5vh", margin: "auto" }} ></AccessTimeIcon>
                    </div>
                    <div style={{ display: "inline-block", marginLeft: "1vw", verticalAlign: "top" }} >
                        <span style={{ fontSize: "2vh" }}>AVG TIME</span><br />
                        <span style={{ fontSize: "2vh" }}>{(this.CalculateAveragePropagationTime()/1000).toLocaleString()}s</span>
                    </div>
                </Grid>
            </Grid>
        );
    }
}
export default NodeMetadata;
