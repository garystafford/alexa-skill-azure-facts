// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS */

const Alexa = require("ask-sdk-core");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

const SKILL_NAME = "Azure Tech Facts";
const CARD_TITLE = `Welcome to ${SKILL_NAME}`;
const FACTS_LIST = "Certifications, Cognitive Services, Competition, Compliance, First Offering, Functions, " +
    "Geographies, Global Infrastructure, Platforms, Categories, Products, Regions, and Release Date";
const BUCKET_URL = "https://s3.amazonaws.com/alexa-skills-gstafford";

const IMAGES = {
    smallImageUrl: `${BUCKET_URL}/azure-108x108.png`,
    largeImageUrl: `${BUCKET_URL}/azure-512x512.png`
};

let myNameString;

/* INTENT HANDLERS */

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "LaunchRequest";
    },
    handle(handlerInput) {
        speechOutput = `Welcome to ${SKILL_NAME}. To start, say, ask a question, or, request a fact.`;
        repromptspeechOutput = `${speechOutput} To list the available facts, say help.`;
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
        return request.type === "IntentRequest"
            && request.intent.name === "AzureFactsIntent";
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        let currentIntent = request.intent;

        if (myNameString === undefined) {
            myNameString = slotValue(request.intent.slots.myName);
        }

        if (!myNameString) {
            return handlerInput.responseBuilder
                .addDelegateDirective(currentIntent)
                .getResponse();
        }

        let myQuestionString = slotValue(request.intent.slots.myQuestion);

        if (!myQuestionString) {
            return handlerInput.responseBuilder
                .addDelegateDirective(currentIntent)
                .getResponse();
        }

        if (myQuestionString.toString().trim() === 'random') {
            myQuestionString = selectRandomFact();
        }

        let fact = await buildFactResponse(myNameString, myQuestionString);
        myNameString = Object.is(myNameString, undefined) ? undefined : capitalizeFirstLetter(myNameString);
        let factToSpeak = `${myNameString}, ${fact.Attributes.Response}`;
        cardContent = factToSpeak;

        console.log(`myName: ${myNameString}`);
        console.log(`myQuestion: ${myQuestionString}`);
        console.log(factToSpeak);

        return handlerInput
            .responseBuilder
            .speak(factToSpeak)
            .reprompt("You can request another fact")
            .withStandardCard(CARD_TITLE, cardContent,
                IMAGES.smallImageUrl, `${BUCKET_URL}\/${fact.Attributes.Image}`)
            .getResponse();
    }
};

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

// Pick a random fact to return
function selectRandomFact() {
    const FACTS_ARRAY = ['description', 'released', 'global', 'regions',
        'geographies', 'platforms', 'categories', 'products', 'cognitive',
        'compliance', 'first', 'certifications', 'competition', 'functions'];

    return FACTS_ARRAY[Math.floor(Math.random() * FACTS_ARRAY.length)];
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
