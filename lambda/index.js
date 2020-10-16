const Alexa = require('ask-sdk-core');
const https = require('https');

function getJson(callback, fileName) {
    let property = {
        host: 'data.corona.go.jp',
        port: 443,
        path: '/converted-json/' + fileName,
        method: 'GET',
    };
    const req = https.request(property, (res) => {
        res.setEncoding('utf8');
        let returnData = '';
        res.on('data', (chunk) => {
            returnData += chunk;
        });
        res.on('end', () => {
            callback(JSON.parse(returnData));
        });
    });
    req.end();
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'コロナウへようこそ！' +
        'このスキルでは、新型コロナウイルス感染症の日本国内における最新情報をお伝えします。' +
        '知りたい情報を「陽性者数」や「入院者数」、「死亡者数」のように言ってみてください。';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('どの情報を知りたいですか？')
            .getResponse();
    }
};

const PatientsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PatientsIntent';
    },
    handle(handlerInput) {
        const prefecture = handlerInput.requestEnvelope.request.intent.slots.prefecture.value;
        if(!prefecture){
            return new Promise((resolve) => {
                getJson((response) => {
                    let speakOutput = '';
                    if(response.length >= 2){
                        let date = response[response.length - 1].date;
                        let npatients = response[response.length - 1].npatients;
                        let cpatients = response[response.length - 1].npatients - response[response.length - 2].npatients;
                        if(cpatients > 0){
                            cpatients = '+' + cpatients;
                        }
                        speakOutput += '日本国内の陽性者数は' + date + '現在、前日比' + cpatients + '人で累積' + npatients + '人となっています。';
                    }
                    speakOutput += '都道府県別の陽性者数をお伝えすることもできます。「東京都の陽性者数」のように言ってみてください。';
                    resolve(handlerInput.responseBuilder.speak(speakOutput).reprompt('他にも知りたい情報がありますか？').getResponse());
                }, 'covid19japan-npatients.json');
            });
        }else{
            const pvalue =  handlerInput.requestEnvelope.request.intent.slots.prefecture.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            return new Promise((resolve) => {
                getJson((response) => {
                    let speakOutput = '';
                    if(response.length > 0){
                        const date = response[0].lastUpdate;
                        const area = response[0].area;
                        let i=0;
                        while(i<area.length){
                            if(area[i]["name_jp"]===pvalue){
                                speakOutput += pvalue + 'の陽性者数は' + date + '現在、累積' + area[i].npatients + '人となっています。';
                            }
                            i=(i+1)|0;
                        }
                    }
                    resolve(handlerInput.responseBuilder.speak(speakOutput).reprompt('他にも知りたい情報がありますか？').getResponse());
                }, 'covid19japan-all.json');
            });
        }
    }
};

const CuresIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CuresIntent';
    },
    handle(handlerInput) {
        return new Promise((resolve) => {
            getJson((response) => {
                let speakOutput = '';
                if(response.length >= 2){
                    let date = response[response.length - 1].date;
                    let ncures = response[response.length - 1].ncures;
                    let ccures = response[response.length - 1].ncures - response[response.length - 2].ncures;
                    if(ccures > 0){
                        ccures = '+' + ccures;
                    }
                    speakOutput += '日本国内の入院治療等実施者数は' + date + '現在、前日比' + ccures + '人で累積' + ncures + '人となっています。';
                }
                resolve(handlerInput.responseBuilder.speak(speakOutput).reprompt('他にも知りたい情報がありますか？').getResponse());
            }, 'covid19japan-ncures.json');
        }); 
    }
};

const DeathsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeathsIntent';
    },
    handle(handlerInput) {
        return new Promise((resolve) => {
            getJson((response) => {
                let speakOutput = '';
                if(response.length >= 2){
                    let date = response[response.length - 1].date;
                    let ndeaths = response[response.length - 1].ndeaths;
                    let cndeaths = response[response.length - 1].ndeaths - response[response.length - 2].ndeaths;
                    if(cndeaths > 0){
                        cndeaths = '+' + cndeaths;
                    }
                    speakOutput += '日本国内の死亡者数は' + date + '現在、前日比' + cndeaths + '人で累積' + ndeaths + '人となっています。';
                }
                resolve(handlerInput.responseBuilder.speak(speakOutput).reprompt('他にも知りたい情報がありますか？').getResponse());
            }, 'covid19japan-ndeaths.json');
        }); 
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'このスキルの使い方を説明します。' +
        'このスキルでは、新型コロナウイルス感染症の日本国内における最新情報をお伝えします。' +
        '知りたい情報を「陽性者数」や「入院者数」、「死亡者数」のように言ってみてください。' +
        '情報は、内閣官房の新型コロナウイルス感染症対策推進室が公開しているウェブサイトを元にしています。' +
        'このスキルは医学的または専門的な根拠に基づく助言を行うものではなく、あくまで情報や知識の提供のみを目的とするものです。' +
        '医学的または専門的な助言、診療、または診断に代わるものではありません。' +
        'スキルを終了する場合は「終了」と言ってください。';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('どうされますか？')
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'またいつでも話しかけてくださいね！さようなら。';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'すみません。'+
        'コロナウではその質問にはお答えできませんが、新型コロナウイルス感染症の日本国内における最新情報をお伝えすることができます。'+
        '知りたい情報を「陽性者数」や「入院者数」、「死亡者数」のように話しかけてみてください。';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('どの情報を知りたいですか？')
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'またいつでも話しかけてくださいね！さようなら。';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'すみません。'+
        'エラーが発生しました。もう一度言っていただけますか？';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('もう一度言っていただけますか？')
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PatientsIntentHandler,
        CuresIntentHandler,
        DeathsIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .lambda();