/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

let SELECTED_SCENE = {};
let CURR_STATE = true;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = '<prosody rate="93%"> <voice name="Salli"> Welcome to Merlin\'s World. Your Interactive Story Adventure. If you are new to this skill, please say, first time, if you would like to get instructions for this skill, say, Instructions, if you would like to start at the beginning scene, say, begin. Otherwise, tell me the scene that you finished on, during your last session to continue on? </voice> </prosody>';
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "homepage",
            document: require('./launchrequest.json'),
            datasources: require('./Datasource.json'),
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
  },
};

const YesIntentHandler = {
 canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const speechText = '<prosody rate="93%"> <voice name="Salli"> Please say, begin to start. </voice> </prosody>';
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "homepage",
            document: require('./launchrequest.json'),
            datasources: require('./Datasource.json')
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
  },
};

const SceneIntentHandler = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SceneIntent') 
      || (handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
        && handlerInput.requestEnvelope.request.arguments.length > 0
        && handlerInput.requestEnvelope.request.arguments[0] != 'videoEnded');
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    let selectedIndex = 0;
    if (request.type  === 'Alexa.Presentation.APL.UserEvent') {
      selectedIndex = parseInt(request.arguments[0]);
    } else {
      selectedIndex = handlerInput.requestEnvelope.request.intent.slots.scene.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    }

    SELECTED_SCENE = MIXED_SCENES[selectedIndex];
    const speechText = " " 
        + SELECTED_SCENE.name + ", "
        + SELECTED_SCENE.recipe;

    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "VideoPlayerToken",
            document: require('./scene.json'),
            datasources: {
              "mixedSceneData": {
                "properties": {
                  "backgroundImg": "YOUR JPG IMAGE HERE",
                  "selectedScene": SELECTED_SCENE
                }
              }
            }
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt("What is your choice please?")
        .getResponse();
    }
  },
};


const OnVideoEndHandler = {
  canHandle(handlerInput) {
    console.log("ARUGMENTS" + JSON.stringify(handlerInput.requestEnvelope));

    return (handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
        && handlerInput.requestEnvelope.request.arguments.length > 0
        && handlerInput.requestEnvelope.request.arguments[0] === 'videoEnded');
  },
  handle(handlerInput) {
      return handlerInput.responseBuilder
        .speak("What would you like to choose next?")
        .reprompt("What would you like to do next?")
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "VideoPlayerToken",
            document: require('./scene.json'),
            datasources: {
              "mixedSceneData": {
                "properties": {
                  "backgroundImg": "YOUR JPG IMAGE HERE",
                  "selectedScene": SELECTED_SCENE
                }
              }
            }
        })
        .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = ' <voice name="Ivy"> <audio src="https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/game-hint-02.mp3" /> You have come to the right place to get some help with this interactive story. I will ask you some questions on how to make this story your own. <break time="0.5s"/> All you need to do, is choose an option for each scene as we go along, i will give you options for each scene and you simply need to tell me what to do next. <break time="0.5s"/> Are you ready to begin? </voice>';
    const reprompt = ' <voice name="Ivy"> What would you like to do please? </voice>';
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(reprompt)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "homepage",
            document: require('./help.json'),
             datasources: require('./HelpRoomScreen.json')
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(reprompt)
        .getResponse();
    }
  },
};

const ResumeAndPauseIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent');
  },
  handle(handlerInput) {
    const speechText = " " 
        + SELECTED_SCENE.name + ", "
        + SELECTED_SCENE.recipe;

    CURR_STATE = !CURR_STATE;

    let playPause = CURR_STATE ? "play" : "pause";

    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak("")
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "VideoPlayerToken",
            document: require('./scene.json'),
            datasources: {
              "mixedSceneData": {
                "properties": {
                  "backgroundImg": "YOUR JPG IMAGE HERE",
                  "selectedScene": SELECTED_SCENE
                }
              }
            }
        })
        .addDirective({
              type: "Alexa.Presentation.APL.ExecuteCommands",
              token: "VideoPlayerToken, VideoPlayerTwoToken",
              commands: [
                {
                  type: "ControlMedia",
                  componentId: "myVideoPlayer",
                  command: playPause
                }
              ]
          })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt("What do you want to do next?")
        .getResponse();
    }
  },
};


const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    
    const response = handlerInput.responseBuilder;

    response.withShouldEndSession(true);
    
    const speechText = '<voice name="Ivy"> <audio src="https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/riser-stop.mp3" /> Thanks for joining us for a magical adventure. Please come back again soon for more adventures in Merlin\'s world. Goodbye </voice>';
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "homepage",
            document: require('./stop.json'),
             datasources: require('./StopRoomScreen.json')
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
    }
  },
};

const NoIntentHandler = {
 canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    
    const response = handlerInput.responseBuilder;

    response.withShouldEndSession(true);
    
    const speechText = '<voice name="Ivy"> <audio src="https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/riser-stop.mp3" /> Thanks for joining us for a magical adventure. Please come back again soon for more adventures in Merlin\'s world. Goodbye </voice>';
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "homepage",
            document: require('./stop.json'),
             datasources: require('./StopRoomScreen.json')
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
    }
  },
};


const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("WHOLE ERROR" + JSON.stringify(error));
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please try saying that again.')
      .reprompt('Sorry, I can\'t understand the command. Please try saying that again.')
      .getResponse();
  },
};

function supportsAPL(handlerInput) {
    const supportedInterfaces = handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface != undefined;
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    YesIntentHandler,
    SceneIntentHandler,
    OnVideoEndHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    NoIntentHandler,
    ResumeAndPauseIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

  const MIXED_SCENES = [
    {
      "name": "Instructions",
      "videoSrc": "YOUR VIDEO MP4 HERE",
      "imgSrc": "YOUR IMAGE JPG HERE",
      "ingredients": [
        {
          "name": "Say, Alexa Begin!",
          "amount": ""
        }
      ],
        "recipe": '<prosody rate="93%"> <voice name="Ivy"> Let\'s begin by explaining how this adventure works. <break time="0.5s"/> There is a twist to this magical story. Actually, there are two twists. <break time="0.5s"/> The first twist is that, <emphasis level="strong">you</emphasis> are Merlin, the legendary wizard. <break time="0.5s"/> The second twist is, that, <emphasis level="strong">you</emphasis> decide the story line by choosing how the story will continue on. <break time="0.5s"/> </voice> <voice name="Salli"> But, Beware! Making an incorrect choice could result in unforeseen circumstances. Choose carefully. At the end of your choices, you will have created your own magical adventure. <break time="0.5s"/> It\'s a bit like putting together a story jigsaw puzzle, except it\'s way more fun. <break time="0.5s"/> Your main goal is to find the lost key to the underworld, hidden inside a castle. <break time="0.5s"/> The problem is, firstly, that you don\'t know which castle the key is hidden in. <break time="0.5s"/> and secondly that you must stay alive to find it. <break time="0.5s"/> Let\'s begin this story by giving you an introduction of your character, Merlin. The powerful and legendary wizard. <break time="0.5s"/> There are many tales of merlin in books and television shows. But there is only one true merlin. <break time="0.5s"/> Born from a mortal woman, and sired from an incubus. Inheriting his powers from the non human. Merlin matures into a young man whom nurtures his powers from curiosity and need, until he becomes ever so powerful and magically gifted. Merlin, the Legendary wizard. <break time="0.5s"/> Please remember to take note and record the scene number you are on, for if you need to leave the game and return at a later date. You can jump straight into the scene number you left anytime you decide to return. If your ready to get this party started. say, begin. </voice> </prosody>'
    },
      {
      "name": "First Time",
      "videoSrc": "YOUR VIDEO MP4 HERE",
      "imgSrc": "YOUR IMAGE JPG HERE",
      "ingredients": [
        {
          "name": "Say, Alexa Begin",
          "amount": ""
        }
      ],
      "recipe": '<prosody rate="93%"> <voice name="Joey"> <audio src="https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/presentation-intro-transition-16.mp3" /> Welcome to our legendary Merlin\'s World. You are sure to have a wonderous and magical adventure. <break time="0.5s"/> If you need to leave the game and return later, Please remember to take note and record the scene number you are on, for if you need to leave the game and return at a later date. You can jump straight into the scene number you left anytime, you decide to return. <break time="0.5s"/> For Instructions on how this game works, <break time="0.5s"/> please say, instructions. </voice> </prosody>'
    },
    {
    "name": "Begin",
      "videoSrc": "YOUR VIDEO MP4 HERE",
      "imgSrc": "YOUR IMAGE JPG HERE",
      "ingredients": [
        {
          "name": "Click Play Button for Video Each Scene",
          "amount": ""
        }
      ],
   "recipe": '<prosody rate="93%"> <voice name="Joey"> <audio src= "https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/magic-appearance.mp3" /> You are travelling along a forest path, the trees forming an arch above you, <break time="0.5s"/> the air is still, and the sun hangs low. You are headed west. <break time="0.5s"/> You come across a witchcraft bundle along your path, <break time="0.5s"/> there is a blue, magical potion bubbling away, begging to be let out. Curious, you have a choice to make. <break time="0.5s"/> Do you pick up potion to inspect, <break time="0.5s"/> throw potion to break it open, <break time="0.5s"/> keep walking <break time="0.5s"/> or, call out to find the witch? </voice> </prosody>'
    },
       {
      "name": "Pick Up Potion",
      "videoSrc": "YOUR VIDEO MP4 HERE",
      "imgSrc": "YOUR IMAGE JPG HERE",
      "ingredients": [
       {
          "name": "",
          "amount": ""
        }
      ],
      "recipe": '<prosody rate="93%"> <voice name="Salli"> You pick up the potion bottle. <break time="0.5s"/> Your vision starts to change and all of a sudden, Skalina, The Goddess of Winter appears to you in a vision. <audio src="https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/magic-appearance.mp3" /> She tells you that she knows where a castle resides hidden in the mountains that may possess the key you seek. <break time="0.5s"/> She tells you to go South and follow the Aurora Borealis to your destination. <break time="0.5s"/> You have a new choice to make. Do you listen to Skalina and go south or do you continue the path north? Please say south or north. </voice> </prosody>'
    },
    {
      "name": "Throw Potion",
      "videoSrc": "YOUR VIDEO MP4 HERE",
      "imgSrc": "YOUR IMAGE JPG HERE",
      "ingredients": [
       {
          "name": "",
          "amount": ""
        }
      ],
      "recipe": '<prosody rate="93%"> <voice name="Joey"> You picked up the bottle of blue bubbling liquid and threw it as far away as you could. <break time="0.5s"/> It cracks open <audio src= "https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/whooshthensmlglas-pe1050613.mp3" /> a big blanket of smoke whooshes out of the bottle, <audio src= "https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/mana-restore-02.mp3" /> then a figure appears. <break time="0.5s"/> You can\'t believe your eyes. <break time="0.5s"/> It is your long lost friend, Tauren, <break time="0.5s"/> an imortal Warlock and your very good friend. <break time="0.5s"/> You are pleased to see him and you ask him, how he ended up in the potion bottle. <break time="0.5s"/> Tauren explains that he was unfortunately captured by a very powerful witch and, put inside the bottle and transformed into liquid so he could not escape by her magical powers. <break time="0.5s"/> Tauren tells you about his journey and why he was on this particular path. <break time="0.5s"/> He is searching for a special person, someone who he needs help from to unlock, a magical spell of healing. <break time="0.5s"/> Tauren asks you where you are headed <break time="0.5s"/> You let him know about the magical key to the underworld that you seek. <break time="0.5s"/> Tauren offers you help with his magical crystal ball, he can see the castle where the key resides and gives you a description of the castle you seek. <break time="0.5s"/> You thank Tauren for his help and, you say your goodbyes to be on your way. <break time="0.5s"/> Your next choice is to go East or to go West, seeking your mystery key. East or West? </voice> </prosody>'
    },
     {
      "name": "Walk Along Path",
      "videoSrc": "YOUR VIDEO MP4 HERE",
      "imgSrc": "YOUR IMAGE JPG HERE",
      "ingredients": [
       {
          "name": "",
          "amount": ""
        }
    
      ],
      "recipe": '<prosody rate="93%"> <voice name="Salli"> You have decided to keep walking along the path. <break time="0.5s"/> After walking for several hours North, you decide to speed things up a little. You fly through the forest. <audio src="https://s3-eu-west-1.amazonaws.com/merlin3/Sounds/whooshes-ec04-78-5.mp3" /> <break time="0.5s"/> Until you come across a river. <break time="0.5s"/> The river looks like it goes for miles. <break time="0.5s"/> You have a choice to make, follow the river or fly over the hills? <break time="0.5s"/></voice> </prosody>'
    }
     
//KEEP REPEATING THESE SCENES LAYOUT AS LONG AS YOU LIKE. FOR MY SKILL, MERLIN'S WORLD, THIS WENT UP UNTIL 1800 LINES OF CODE//

  ];
