const textToSpeech = require('@google-cloud/text-to-speech');
const { writeFileSync } = require("fs");
const mp3Duration = require('mp3-duration');
const client = new textToSpeech.TextToSpeechClient();

const convertTextToSpeech = async (
    text,
    index = 0, {
        speakingRate = 1.3,
        pitch = -2,
    } = {}
) => {
    console.log(text);
    const request = {
        input: {
            text
        },
        // Select the language and SSML voice gender (optional)
        // https://cloud.google.com/text-to-speech/docs/voices
        voice: {
            // languageCode: 'pt-BR',
            // name: "pt-BR-Wavenet-B",
            languageCode: 'en-US',
            name: "en-US-Wavenet-I",
            ssmlGender: 'MALE',
        },
        // select the type of audio encoding
        audioConfig: {
            effectsProfileId: [
                "headphone-class-device"
            ],
            pitch,
            speakingRate,
            audioEncoding: "LINEAR16"
        },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Write the binary audio content to a local file
    const fileName = 'output-' + index + '.wav';
    await writeFileSync(fileName, response.audioContent, 'binary');
    const duration = await mp3Duration(response.audioContent);

    return [duration, fileName];
};

module.exports = convertTextToSpeech;
