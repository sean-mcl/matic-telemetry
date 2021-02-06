var lastBlock = null;
var rowTemplate = '<tr id="{{nodeId}}">' +
    '<td>{{timestamp}}</td>' +
    '<td>{{category}}</td>' +
    '<td>{{nodeId}}</td>' +
    '<td>{{softwareVersion}}</td>' +
    '<td>{{blockNumber}}</td>' +
    '<td>{{blockHash}}</td>' +
    '<td>{{blockTime}}</td>' +
    '<td>{{blockPropagationTime}}</td>' +
    '</tr>';

var tbody = $('#messages').children('tbody');
var table = tbody.length ? tbody : $('#messages');

// Create a client instance
host = "127.0.0.1";
port = 80;
clientId = `client-${generateId(16)}`;
client = new Paho.Client(host, port, clientId);

// Set callback handlers
client.onConnectionLost = onConnectionLost;
client.onConnected = onConnect;
client.onMessageArrived = onMessageArrived;

// Set topic regex
var topicRegex = new RegExp("metrics/categories/([^/]+)/nodes/([^/]+)");

// Connect the client
client.connect({ reconnect: true });

// Make the tables sortable
makeTablesSortable();

// Make the table data copyable
makeTableDataCopyable();

// Fired when the client connects
function onConnect(isReconnect, Uri) {
    if (isReconnect) {
        success("Reconnected successfully!");
    }
    else {
        success("Connected successfully!");
    }
    client.subscribe("metrics/categories/+/nodes/+");
    client.subscribe("metrics/connected-nodes");
}

// Fired when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        error("Connection lost!");
    }
}

// Fired when a message arrives
function onMessageArrived(message) {
    if (message.topic == "metrics/connected-nodes") {
        var payload = JSON.parse(message.payloadString);
        var count = payload.data.count;
        $('#nodeCount').text(count);
    }
    else {

        var category = topicRegex.exec(message.topic)[1];
        var nodeId = topicRegex.exec(message.topic)[2];
        var payload = JSON.parse(message.payloadString);
        var parsedDate = Date.parse(payload.dateTime);

        if (!lastBlock) {
            lastBlock = parsedDate;
        }
        else {
            lastBlock = parsedDate > lastBlock ? parsedDate : lastBlock;
        }

        setRowParameter(category, nodeId, payload);
    }
}

// Appends or replaces a table row with the given payload
function setRowParameter(category, nodeId, payload) {
    var row = $(`tr[id='${nodeId}']`)

    var rowContent = rowTemplate.compose({
        'timestamp': payload.dateTime,
        'category': category,
        'nodeId': nodeId,
        'softwareVersion': payload.softwareVersion,
        'blockNumber': payload.blockNumber,
        'blockHash': payload.blockHash,
        'blockTime': payload.blockTime,
        'blockPropagationTime': payload.blockPropagationTime
    });

    if (row.length) {
        row.replaceWith(rowContent);
    }
    else {
        table.append(rowContent);
    }
}

// Update the overall metrics 
setInterval(function () {
    if (lastBlock) {
        var diff = Date.now() - lastBlock;
        $('#lastBlock').text((diff) / 1000 + "s ago");
    }
}, 100);

// Generate a client id
function generateId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Makes all tables sortable
function makeTablesSortable() {
    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

    const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
        v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

    document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
        const table = th.closest('table');
        const tbody = table.querySelector('tbody');
        Array.from(tbody.querySelectorAll('tr'))
            .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
            .forEach(tr => tbody.appendChild(tr));
    })));
}

// Makes all table data content copyable
function makeTableDataCopyable() {
    $(document).on('click', function (event) {
        if (event.target.tagName == "TD") {
            copyToClipboard(event.target.textContent);
            success("Copied to clipboard successfully!");
        }
        event.stopPropagation();
        event.stopImmediatePropagation();
    });

}

// Copies the given text to the clipboard
function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function success(text){
    console.log(new Date().toISOString() + " [Success] " + text);
    M.toast({html: text, classes: 'green white-text'})
}

function information(text){
    console.log(new Date().toISOString() + " [   Info] " + text);
    M.toast({html: text, classes: 'matic white-text'})
}

function error(text){
    console.log(new Date().toISOString() + " [  Error] " + text);
    M.toast({html: text, classes: 'red white-text'})
}

function warning(text){
    console.log(new Date().toISOString() + " [Warning] " + text);
    M.toast({html: text, classes: 'yellow white-text'})
}

//Composes template strings 
String.prototype.compose = (function () {
    var re = /\{{([^\}]+)\}}/g;
    return function (o) {
        return this.replace(re, function (_, k) {
            return typeof o[k] != 'undefined' ? o[k] : '';
        });
    }
}());
