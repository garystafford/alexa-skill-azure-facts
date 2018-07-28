#!/bin/sh

# simulate command doesn't seem to work well with initial intent in invocation?

# constants
LOCALE="en-US"
SKILL_ID="<your_skill_id>"
PROFILE="default"

# utterances to tests
declare -a utterances=(
  "load Azure Tech Facts"
  "ask a question"
  "my name is Alice"
  "tell me about certifications"
  "load Azure Tech Facts"
  "give me a fact"
  "my name is Bob"
  "tell me about Azure's release date"
  # "ask Azure Tech Facts for a fact"
  # "my name is Matt"
  # "when was Azure released"
  # "ask Azure Tech Facts about Azure's Cognitive Services"
  # "my name is Frank"
  # "ask Azure Tech Facts for a random fact for Gary"
  # "ask Azure Tech Facts to tell Michele about global infrastructure"
  # "ask Azure Tech Facts about certifications for Shawn"
)

for utterance in "${utterances[@]}"
do
  echo "Utterance: ${utterance}"
  ask simulate \
    --text "$utterance" \
    --locale $LOCALE \
    --skill-id $SKILL_ID \
    --profile $PROFILE
  sleep 2s
done
