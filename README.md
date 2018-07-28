# Azure Tech Facts Alexa Custom Skill

Demonstration skill for post, [Building Asynchronous, Serverless Alexa Skills with AWS Lambda, DynamoDB, S3, and Node.js](https://wp.me/p1RD28-5Vq). Explores the creation of an Alexa Custom Skill, using the latest Alexa Skills Kit, the AWS Serverless Platform, and Node.js.

## About the Skill

Ask Alexa technical facts about Microsoft Azure, the cloud computing service created by Microsoft for building, testing, deploying, and managing applications and services through a global network of Microsoft-managed data centers. Current facts include Certifications, Cognitive Services, Competition, Compliance, Description, First Product, Geographies, Global Presence, Platforms, Product Categories, Products, Regions, Release Date.

## Deployment and Testing

```bash
export AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
ask init # create default profile
ask deploy --profile default
```

## Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name AzureFacts \
  --attribute-definitions \
    AttributeName=Fact,AttributeType=S \
  --key-schema AttributeName=Fact,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=3,WriteCapacityUnits=3
```

## Import data into DynamoDB

```bash
aws dynamodb batch-write-item \
  --request-items file://data/AzureFacts.json
```

## Create S3 Bucket

```bash
aws s3api create-bucket \
  --bucket <your_bucket_name> \
  --region us-east-1
```

## Simulate Skill

```bash
ask simulate \
  --text "Load Azure Tech Facts" \
  --locale "en-US" \
  --skill-id "<your_skill_id>" \
  --profile "default"

# run multiple tests
sh ./tests/tests.sh
```

## Sample Invocations

#### One-Shot Invocation

-   "Alexa, ask Azure Tech Facts for a random fact for Gary"
-   "Alexa, ask Azure Tech Facts to tell Michele about global infrastructure"
-   "Alexa, ask Azure Tech Facts about certifications for Shawn"

#### 4-part Invocation

-   "Alexa, load Azure Tech Facts"
-   "Ask a question"
-   "My name is Alice"
-   "Tell me about certifications"

#### 3-part Invocation

-   "Alexa, ask Azure Tech Facts for a fact"
-   "My name is Matt"
-   "When was Azure released"

#### 2-part Invocation

-   "Alexa, ask Azure Tech Facts about Azure's Cognitive Services"
-   "My name is Frank"

## References

-   <https://developer.amazon.com/docs/smapi/skill-manifest.html>
-   <https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html>
-   <https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html#GettingStarted.NodeJs.03.04>
