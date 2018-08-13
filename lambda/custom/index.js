// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

"use strict";
const Alexa = require("ask-sdk-core");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

/* CONSTANTS */
const SKILL_NAME = "Azure Tech Facts";
const CARD_TITLE = `Welcome to ${SKILL_NAME}`;
const FACTS_ARRAY = ["description", "released", "global", "regions", "geographies", "platforms", "categories", "products", "cognitive", "compliance", "first", "certifications", "competition"];
const FACTS_LIST = "Certifications, Cognitive Services, Competition, Compliance, First Products, Geographies, Global Presence, Platforms, Product Categories, Products, Regions, and Release Date";
const BUCKET_URL = "https://s3.amazonaws.com/alexa-skills-gstafford";

const IMAGES = {
    smallImageUrl: `${BUCKET_URL}/azure-108x108.png`,
    largeImageUrl: `${BUCKET_URL}/azure-512x512.png`
};

let myName, myQuestion;

/* INTENT HANDLERS */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "LaunchRequest";
    },
    handle(handlerInput) {
        speechOutput = `Welcome to ${SKILL_NAME}. To start, say, ask a question, or, give me a fact. To list the available facts, say help.`;
        repromptspeechOutput = speechOutput;
        cardContent = `${speechOutput}\nAvailable facts include ${FACTS_LIST}.`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptspeechOutput)
            .withStandardCard(CARD_TITLE, cardContent,
                IMAGES.smallImageUrl, `${BUCKET_URL}\/image-01.png`)
            .getResponse();
    },
};

const AzureFactsIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "IntentRequest" && (
            request.intent.name === "AzureFactsIntent" ||
            request.intent.name === "AMAZON.YesIntent"
        );
    },
    async handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        let slotToElicit;

        if (slots !== undefined && slots.myName !== undefined) {
            myName = slotValue(slots.myName);
        } else {
            console.log(`foo myName: ${myName}`);
            slotToElicit = "myName";
            speechOutput = "Who am I speaking to. You can say things like, my name is Gary.";
            repromptspeechOutput = "Who am I speaking to?";
            cardContent = speechOutput;

            return handlerInput.responseBuilder
                .addElicitSlotDirective(slotToElicit)
                .speak(speechOutput)
                .reprompt(repromptspeechOutput)
                .withStandardCard(CARD_TITLE, cardContent, IMAGES.smallImageUrl, IMAGES.largeImageUrl)
                .getResponse();
        }

        console.log(`foo foo myQuestion: ${myQuestion}`);

        if (slots !== undefined && slots.myQuestion !== undefined) {
            myQuestion = slotValue(slots.myQuestion);
            console.log(`foo foo foo myQuestion: ${myQuestion}`);

        } else {
            console.log(`foo myQuestion: ${myQuestion}`);
            slotToElicit = "myQuestion";
            speechOutput = "What would you like to know about Azure. You can say things like, tell me about Azure's global infrastructure, or when was Azure released?";
            repromptspeechOutput = "What would you like to know about Azure?";
            cardContent = speechOutput;

            return handlerInput.responseBuilder
                .addElicitSlotDirective(slotToElicit)
                .speak(speechOutput)
                .reprompt(repromptspeechOutput)
                .withStandardCard(CARD_TITLE, cardContent, IMAGES.smallImageUrl, IMAGES.largeImageUrl)
                .getResponse();
        }

        // return a random fact...
        if (myQuestion === "random") {
            myQuestion = FACTS_ARRAY[Math.floor(Math.random() * FACTS_ARRAY.length)];
        }

        let fact = await buildFactResponse(myName, myQuestion);
        myName = Object.is(myName, undefined) ? undefined : capitalizeFirstLetter(myName);
        console.log(`myName: ${myName}`);
        console.log(`myQuestion: ${myQuestion}`);
        let factToSpeak = `${myName}, ${fact.Attributes.Response}`;
        console.log(factToSpeak);
        cardContent = factToSpeak;
        myQuestion = undefined;
        return handlerInput
            .responseBuilder
            .speak(factToSpeak + " Would you like another fact?")
            .reprompt("Would you like another fact?")
            .withStandardCard(CARD_TITLE, cardContent,
                IMAGES.smallImageUrl, `${BUCKET_URL}\/${fact.Attributes.Image}`)
            .getResponse();
    },
};


// const YesIntentHandler = {
//     canHandle(handlerInput) {
//         const request = handlerInput.requestEnvelope.request;
//         return request.type === "IntentRequest"
//             && request.intent.name === "AMAZON.YesIntent";
//     },
//     handle(handlerInput) {
//         return handlerInput
//             .responseBuilder
//             .addDelegateDirective(AzureFactsIntent)
//             .getResponse();
//     },
// };
//
// const NoIntentHandler = {
//     canHandle(handlerInput) {
//         const request = handlerInput.requestEnvelope.request;
//         return request.type === "IntentRequest"
//             && request.intent.name === "AMAZON.NoIntent";
//     },
//     handle(handlerInput) {
//         return handlerInput
//             .responseBuilder
//             .addDelegateDirective(ExitHandler)
//             .getResponse();
//     },
// };

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "IntentRequest"
            && request.intent.name === "AMAZON.HelpIntent";
    },
    handle(handlerInput) {
        speechOutput = `Current facts include: ${FACTS_LIST}.`;
        repromptspeechOutput = "To start, say, ask a question. To list the available facts, say help.";
        cardContent = speechOutput;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptspeechOutput)
            .withStandardCard(CARD_TITLE, cardContent, IMAGES.smallImageUrl, IMAGES.largeImageUrl)
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === `IntentRequest` && (
            request.intent.name === 'AMAZON.StopIntent' ||
            request.intent.name === 'AMAZON.PauseIntent' ||
            request.intent.name === 'AMAZON.CancelIntent' ||
            request.intent.name === "AMAZON.NoIntent"
        );
    },
    handle(handlerInput) {
        speechOutput = "Goodbye!";
        cardContent = speechOutput;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withStandardCard(CARD_TITLE, cardContent, IMAGES.smallImageUrl, IMAGES.largeImageUrl)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "SessionEndedRequest";
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        speechOutput = `Sorry, I cannot understand the command. Please say again.`;
        repromptspeechOutput = speechOutput;
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptspeechOutput)
            .getResponse();
    },
};

/* HELPER FUNCTIONS */
let cardContent, speechOutput, repromptspeechOutput;

function slotValue(slot, useId) {
    let value = slot.value;
    let resolution = (slot.resolutions && slot.resolutions.resolutionsPerAuthority
        && slot.resolutions.resolutionsPerAuthority.length > 0) ? slot.resolutions.resolutionsPerAuthority[0] : null;
    if (resolution && resolution.status.code === "ER_SUCCESS_MATCH") {
        let resolutionValue = resolution.values[0].value;
        value = resolutionValue.id && useId ? resolutionValue.id : resolutionValue.name;
    }
    return value;
}

// Format names which come over as all lowercase from Alexa
function capitalizeFirstLetter(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

// Increments hits by 1 and returns values all in one call to DynamoDB
function buildFactResponse(myName, myQuestion) {
    return new Promise((resolve, reject) => {
        if (myQuestion !== undefined) {
            let params = {};
            params.TableName = "AzureFacts";
            params.Key = {"Fact": myQuestion};
            params.UpdateExpression = "set Hits = Hits + :val";
            params.ExpressionAttributeValues = {":val": 1};
            params.ReturnValues = "ALL_NEW";

            docClient.update(params, function (err, data) {
                if (err) {
                    console.log("GetItem threw an error:", JSON.stringify(err, null, 2));
                    reject(err);
                } else {
                    console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                    resolve(data);
                }
            });
        }
    });
}

/* LAMBDA SETUP */
const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        AzureFactsIntent,
        HelpIntentHandler,
        ExitHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
