import * as React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

class Map extends React.Component {
    constructor(props) {
        super(props);
        this.child = React.createRef();
        this.state = { isConnected: false, markers: [] };
    };

    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    addMarker = (id, category, m) => {
        var { markers } = this.state
        if (!m.isActive) {
            var marker = markers.filter(function (item) { return item.id === id; })[0] || null;
            if (marker != null) {
                marker.payload.isActive = false;
            }
            this.setState({ markers });
            return;
        }
        // Remove existing markers with the same client id
        var marker = markers.filter(function (item) { return item.id === id; })[0] || null;
        if (marker != null) {
            markers = markers.filter(item => item !== marker)
        }

        if (m.location == null || m.location.status == "fail") return;
        markers.push({ id: id, category: category, payload: m })
        this.setState({ markers })
    }

    static GenerateId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    CopyToClipboard(value) {
        if (navigator != null && navigator.clipboard != null) {
            navigator.clipboard.writeText(value);
            this.child.current.open();
        }
    };

    Test(row) {
        this.CopyToClipboard(JSON.stringify(row.row, null, 2));
    }

    componentDidMount() {
        var mqtt = require('mqtt')

        var context = this;

        var options = {
            protocol: 'ws',
            clientId: `client-${Map.GenerateId(32)}`
        };

        var client = mqtt.connect(this.props.server, options)

        client.on('connect', function () {
            context.state.isConnected = true;
            client.subscribe(`status/categories/+/nodes/+`);
        });

        client.on('reconnect', function () {
            context.state.isConnected = true;
            client.subscribe(`status/categories/+/nodes/+`);
        });

        client.on('close', function () {
            context.state.isConnected = false;
        });

        client.on('message', function (topic, message) {
            if (context.state == null) {
                return;
            }
            const statusRegex = new RegExp(`status/categories/([^/]+)/nodes/([^/]+)`);
            var statusMatch = statusRegex.exec(topic);
            if (statusMatch == null) return;
            var payload = JSON.parse(message);
            context.addMarker(statusMatch[2], statusMatch[1], payload);
        });

    }


    componentWillUnmount() {
        if (this.client != null) {
            this.client.end();
        }
    }

    blueIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    greyIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    violetIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    goldIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    logoSwitch(payload) {
        if (!payload.isActive) return this.greyIcon;

        switch (payload.category) {
            case 'Bor Service':
                return this.blueIcon;
            case 'Heimdall Service':
                return this.goldIcon;
            case 'Heimdall Bridge':
                return this.violetIcon;
            case 'REST Server':
                return this.greenIcon;
            default:
                return this.greyIcon;
        }
    }

    render() {
        return (
            <div style={{ height: "calc(100vh - 48px - 64px - 4px)", backgroundColor: "rgb(56, 56, 56, 0.7)" }}>
                <MapContainer maxBounds={[[-60, -170], [80, 170]]} zoomControl={false} center={[20, 0]} zoom={2.5} doubleClickZoom={false} touchZoom={false} scrollWheelZoom={false} style={{ height: "100%", width: "100%", backgroundColor: "rgb(56, 56, 56, 0.0)" }}>
                    <TileLayer opacity={0.7} noWrap={true} bounds={[[-90, -180], [90, 180]]}
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {this.state.markers.map((m) =>
                        <Marker key={`marker-${m.id}`} icon={this.logoSwitch(m.payload)} position={[m.payload.location.lat, m.payload.location.lon]}>
                            <Popup>
                                <strong>{m.id}</strong>
                                <br />
                                <span>{m.category}</span>
                                <br />
                                <span>{m.payload.location.country}</span>
                                <br />
                                <span>{m.payload.location.city}</span>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div >
        )
    }
}

export default Map;
