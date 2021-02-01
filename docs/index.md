<a href="https://matic.network/">
 <img src="./img/matic-network-matic-logo.png" alt="Matic Logo" align="right" height="60" />
</a>

Matic Telemetry
======================

[Matic Network](https://matic.network/) brings massive scale to Ethereum using an adapted version of Plasma with PoS based side chains.
This repository contains the Matic Telemetry, which makes it possible to receive event-based information about the running nodes. 
These metrics can be subscribed by any front-end and displayed accordingly in the UI.

## Table of Contents
- [Matic Telemetry](#matic-telemetry)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
    - [MQTT](#mqtt)
      - [General](#general)
      - [Example](#example)
  - [License](#license)
  - [Links](#links)

## Architecture
### MQTT
#### General
[MQTT](https://mqtt.org/) is an OASIS standard messaging protocol for the Internet of Things (IoT). It is designed as an extremely lightweight publish/subscribe messaging transport that is ideal for connecting remote devices with a small code footprint and minimal network bandwidth. MQTT today is used in a wide variety of industries, such as automotive, manufacturing, telecommunications, oil and gas, etc..

We have several Matic nodes that publish their metrics with a specified topic. These topics can be subscribed by different clients and displayed accordingly, for example in the web UI. The broker ensures that the messages from the different topics are forwarded to the corresponding clients.

#### Example
In the following example we have two matic nodes. Each of these nodes **must** have a unique ID and **can** be assigned to a category.
The client can then prefilter the topics in the web UI and thus only the necessary data is transferred from the broker to the client.
Using the wildcards "+" and "#" you can also subscribe to all categories and/or nodes.

<div style="text-align:center" >
<img src="./img/mqtt-example.png" style="widht: auto" alt="MQTT Example"/>
</div>

## License

The Matic Telemetry Project is licensed under the terms of GNU General Public License v3.0 and is available for free.

## Links

* [Matic Network](https://matic.network/)
* [MQTT](https://mqtt.org/)
* [GitHub Repo](https://github.com/sean-mcl/matic-telemetry)
