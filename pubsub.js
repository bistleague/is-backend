/**
 * Google Cloud Pub/Sub wrapper
 *
 * @author Muhammad Aditya Hilmy
 */

const {PubSub} = require('@google-cloud/pubsub');

const pubsub = new PubSub({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH,
});

/**
 * List all topics
 */
exports.listTopics = async function() {
    // Lists all topics
    const [topics] = await pubsub.getTopics();
    return topics;
};

/**
 * Create topic
 * @param topicName Topic name
 */
exports.createTopic = async function(topicName) {
    // Create new topic
    await pubsub.createTopic(topicName);
    console.log(`Topic ${topicName} created.`);
};

/**
 * Delete topic
 * @param topicName topic name
 */
exports.deleteTopic = async function(topicName) {
    // Delete topic
    await pubsub.topic(topicName).delete();
    console.log(`Topic ${topicName} deleted.`);
};

/**
 * Publish message to topic
 * @param topicName topic name
 * @param data payload to send to topic
 */
exports.publishMessage = async function (topicName, data) {
    const dataBuffer = Buffer.from(data);

    const messageId = await pubsub.topic(topicName).publish(dataBuffer);
    console.log(`Message ${messageId} published.`);
};