var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');

var port = 3700;
var outFile = 'speech.wav';
var app = express();


/*************** Watson STT  ***********/
const { IamAuthenticator } = require('ibm-watson/auth');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: 'CZd8HpMKYjHO4WpKf7CnvNmP56kViSD88V5iUtiQK8hw',
  }),
  url: 'https://api.eu-gb.speech-to-text.watson.cloud.ibm.com',
});

var params = {
  objectMode: true,
  contentType: 'audio/wav',
  model: 'en-US_BroadbandModel',
  keywords: ['colorado', 'tornado', 'tornadoes'],
  keywordsThreshold: 0.5,
  maxAlternatives: 3
};

// Create the stream.
var recognizeStream = speechToText.recognizeUsingWebSocket(params);

/********************************************/

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});


app.listen(port);

console.log('server open on port ' + port);

binaryServer = BinaryServer({port: 9001});

binaryServer.on('connection', function(client) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
    stream.pipe(fileWriter);

    stream.on('end', function() {
      fileWriter.end();
      console.log('wrote to file ' + outFile);
      console.log('Starting to recognize');
      fs.createReadStream('speech.wav').pipe(recognizeStream);


      // Listen for events.
        recognizeStream.on('data', function(event) { onEvent('Data:', event); });
        recognizeStream.on('error', function(event) { onEvent('Error:', event); });
        recognizeStream.on('close', function(event) { onEvent('Close:', event); });

        // Display events on the console.
        function onEvent(name, event) {
            console.log(name, JSON.stringify(event, null, 2));
        };
    });
  });
});
