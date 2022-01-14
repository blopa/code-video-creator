const textToSpeech = require('@google-cloud/text-to-speech');
const { writeFileSync } = require("fs");
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
            audioEncoding: "MP3"
        },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Write the binary audio content to a local file
    await writeFileSync('output-' + index + '.mp3', response.audioContent, 'binary');
};

module.exports = convertTextToSpeech;
