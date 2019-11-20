"use strict";
"use-strict";

const stan = require("node-nats-streaming");

const subscriptionHandler = msg => {
    console.log("Received a message [" + msg.getSequence() + "] " + msg.getData());
};
const unsubscribeHandler = connection => {
    connection.close();
};

const getBodyMsgParam = ({ paramName, event }) => JSON.parse(event.body)[paramName];
const returnObj = msg => ({
    statusCode: 200,
    body: JSON.stringify({ msg })
});

const publishMsg = async ({ channel, eventMsg, clientId }) => {
    return new Promise((resolve, reject) => {
        const stanConnected = stan.connect("test-cluster", clientId);
        stanConnected.on("connect", () => {
            stanConnected.publish(channel, eventMsg, (err, guid) => {
                if (err) {
                    reject(err);
                }
                resolve(guid);
            });
        });
    });
};

module.exports.publish = async event => {
    const clientId = event.requestContext.requestId;
    const channel = getBodyMsgParam({ event, paramName: "channel" });
    const eventMsg = getBodyMsgParam({ event, paramName: "msg" });
    const guid = await publishMsg({ channel, eventMsg, clientId });
    console.log(`GUID:   ${guid}`);
    return returnObj(`Published msg with guid: ${guid}`);
};
