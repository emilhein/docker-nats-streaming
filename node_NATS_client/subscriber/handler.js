"use strict";
"use-strict";

const stan = require("node-nats-streaming");

const getBodyMsgParam = ({ paramName, event }) => JSON.parse(event.body)[paramName];
const returnObj = msg => ({
    statusCode: 200,
    body: JSON.stringify({ msg })
});

const subscribeChannel = async ({ channel, clientId }) => {
    let accumulator = [];
    return new Promise((resolve, reject) => {
        const stanConnected = stan.connect("test-cluster", clientId);
        stanConnected.on("connect", () => {
            const subscriptionOptions = stanConnected
                .subscriptionOptions()
                // .setManualAckMode(true)
                .setMaxInFlight(200)
                .setDeliverAllAvailable();
            // .setStartWithLastReceived();
            console.log(`Gonna subscribe to ${channel} with ${clientId}`);
            const subscription = stanConnected.subscribe(channel, subscriptionOptions);
            subscription.on("message", function(msg) {
                accumulator.push({ seq: msg.getSequence(), data: msg.getData() });
            });
            setTimeout(function() {
                subscription.unsubscribe();
                subscription.on("unsubscribed", function() {
                    stanConnected.close();
                    resolve(accumulator);
                });
            }, 1000);
        });
    });
};

module.exports.subscribe = async event => {
    const clientId = event.requestContext.requestId;
    const channel = getBodyMsgParam({ event, paramName: "channel" });
    const res = await subscribeChannel({ channel, clientId });
    return returnObj(res);
};
