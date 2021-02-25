import * as React from 'react';
import { DataGrid } from '@material-ui/data-grid';

import Alert from './Alert'
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

class NodeTable extends React.Component {
  constructor(props) {
    super(props);

    // Create reference for the alerts
    this.child = React.createRef();

    // Initialize the table columns
    const columns = [
      {
        field: 'status', headerName: 'Status', width: 40, renderCell: (params) => {
          var nodeId = params.getValue('id');
          var nodeStatusElem = this.state.nodeStates.filter(function (item) { return item.id === nodeId; })[0] || null;
          var nodeStatus = nodeStatusElem == null ? false : nodeStatusElem.status;
          return nodeStatus == true ? <FiberManualRecordIcon style={{ fill: "green" }} /> : <FiberManualRecordIcon style={{ fill: "red" }} />
        }
      },
      { field: 'id', headerName: 'ID', width: 180 },
      { field: 'type', headerName: 'Type', width: 180 },
      { field: 'timestamp', headerName: 'Timestamp', width: 200, renderCell: (params) => params.value.slice(0, 19) },
      { field: 'softwareVersion', headerName: 'Version', width: 130 },
      { field: 'peerCount', headerName: 'Peers', width: 130 },
      { field: 'queueCount', headerName: 'Queue', width: 130 },
      { field: 'blockNumber', headerName: 'BlockNumber', width: 180, renderCell: (params) => { return "#" + params.value.toLocaleString() } },
      { field: 'blockHash', headerName: 'BlockHash', width: 200 },
      { field: 'blockTime', headerName: 'BlockTime', width: 200, renderCell: (params) => { return params.value.toLocaleString() + "s" } },
      { field: 'blockPropagationTime', headerName: 'BlockPropagationTime', width: 200, renderCell: (params) => { return params.value.toLocaleString() + "ms" } },
    ];

    // Set the state
    this.state = { columns: columns, rows: [], sortModel: [{ field: 'id', sort: 'asc', }], nodeStates: [] };
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

  // Copys the given value to the clipboard
  CopyToClipboard(value) {
    if (navigator != null && navigator.clipboard != null) {
      navigator.clipboard.writeText(value);
      this.child.current.open();
    }
  };

  CalculateLastTimestamp() {
    var now = Date.now();
    var max = Math.max.apply(Math, this.state.rows.map(function (r) { return Date.parse(r.timestamp); }));
    return now - max;
  }

  // Called when table has been rendered
  componentDidMount() {

    // Create the mqtt client
    var mqtt = require('mqtt')
    var context = this;
    var options = {
      protocol: 'ws',
      clientId: `client-${NodeTable.GenerateId(32)}`
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
      }, 250);
    });

    client.on('reconnect', function () {
      context.state.isConnected = true;
      client.subscribe(`metrics/categories/${context.props.category}/nodes/+`);
      client.subscribe(`status/categories/${context.props.category}/nodes/+`);
      context.state.interval = setInterval(() => {
        context.setState((previousState) => ({ rows: previousState.rows }))
      }, 250);
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
      <div style={{ height: "calc(100vh - 48px - 64px - 4px - 14vh)", width: '100%', backgroundColor: "rgb(56, 56, 56, 0.7)" }}>
        <Alert ref={this.child}></Alert>
        <DataGrid localeText loading={!this.state.isConnected} rows={this.state.rows} onRowClick={(e) => this.CopyToClipboard(JSON.stringify(e.row, null, 2))} columns={this.state.columns} disableSelectionOnClick onCellClick={(params) => this.CopyToClipboard(params.value)} />
      </div>)
  }
}

export default NodeTable;
