/*  // Wake Word
  string wake_word = 1;

  // Mic channel
  enum MicChannel {
    channel0 = 0;
    channel1 = 1;
    channel2 = 2;
    channel3 = 3;
    channel4 = 4;
    channel5 = 5;
    channel6 = 6;
    channel7 = 7;
    channel8 = 8;
  }

  MicChannel channel = 2;

  // lenguaje model path from lmtool or similar alternative:
  // http://www.speech.cs.cmu.edu/tools/lmtool-new.html
  string lm_path = 3;

  // dictionary path from lmtool
  string dic_path = 4;

  // enable pocketsphinx verbose mode
  bool enable_verbose = 5;

  // stop recognition service
  bool stop_recognition = 6;
  */
let protoBuilder, matrixMalosBuilder;

const debug = debugLog('wakeword');

module.exports = {
  init: () => {
    protoBuilder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = protoBuilder.build('matrix_malos');
  },
  read: (buffer) => {
    debug('read', buffer.toString());
    // strip unicode
    return { speech: buffer.toString().trim().replace(/[^\x2000-\x7FFF]/g,'')}
  },
  config: (config) => {
    debug('config', config);
  },
  /**
   * @param config.channel - which microphone
   * @param config.options.phrase - set wakeword, defaults to MATRIX
   */
  prepare: (config, cb) => {
    debug('prepare', config);
    if ( !_.has( config.options, 'wakeword' ) ){
      return console.error('No Wakeword Specified in Driver');
    }
    var wakeword = config.options.wakeword;

    // TODO: Check wakeword vs stored models

    // TODO: Manage dictionaries
    // 8383 - hey joe
    // 6854 - matrix
    var malosConfig = new matrixMalosBuilder.DriverConfig;

    let voiceConfigProto = new matrixMalosBuilder.WakeWordParams;
    voiceConfigProto.set_wake_word(wakeword.toUpperCase());
    voiceConfigProto.set_lm_path('/home/pi/assets/voice.lm');
    voiceConfigProto.set_dic_path('/home/pi/assets/voice.dic');

    if (_.has(config.options, 'channel')) {
      if (
        _.isInteger(config.options.channel) &&
        config.options.channel <= 8 &&
        config.options.channel >= 0
      ) {
        let channel = matrixMalosBuilder.WakeWordParams.MicChannel['channel' + config.options.channel];
        voiceConfigProto.set_channel(channel);
      } else {
        return console.error('Invalid Channel ( 0-8 )', config.options.channel);
      }
    } else {
      voiceConfigProto.set_channel(matrixMalosBuilder.WakeWordParams.MicChannel.channel8);
    }
    voiceConfigProto.set_enable_verbose(true);
    malosConfig.set_wakeword(voiceConfigProto);
    debug('proto>'.green, malosConfig)
    cb(malosConfig.encode().toBuffer());
  },
  stop: () => {
    let voiceConfigProto = new matrixMalosBuilder.WakeWordParams;
    voiceConfigProto.set_stop_recognition(true);
    Matrix.components.wakeword.config(voiceConfigProto.encode().toBuffer());
  },
  error: function(err) {
    debug(err);
  }
};

/**
 * 
// This is how we connect to the creator. IP and port.
// The IP is the IP I'm using and you need to edit it.
// By default, MALOS has its 0MQ ports open to the world.

// Every device is identified by a base port. Then the mapping works
// as follows:
// BasePort     => Configuration port. Used to config the device.
// BasePort + 1 => Keepalive port. Send pings to this port.
// BasePort + 2 => Error port. Receive errros from device.
// BasePort + 3 => Data port. Receive data from device.

var creator_ip = '127.0.0.1';
var creator_wakeword_base_port = 60001;
var creator_everloop_base_port = 20013 + 8 // port for Everloop driver.
var protoBuf = require("protobufjs");
var zmq = require('zmq');

var protoBuilder = protoBuf.loadProtoFile('../../protocol-buffers/malos/driver.proto');
var matrixMalosBuilder = protoBuilder.build("matrix_malos");
var configSocket = zmq.socket('push')
configSocket.connect('tcp://' + creator_ip + ':' + creator_wakeword_base_port /* config */

// ********** Start error management.
// var errorSocket = zmq.socket('sub')
// errorSocket.connect('tcp://' + creator_ip + ':' + (creator_wakeword_base_port + 2))
// errorSocket.subscribe('')
// errorSocket.on('message', function(error_message) {
//   process.stdout.write('Received Wakeword error: ' + error_message.toString('utf8') + "\n")
// });
// // ********** End error management.

// /**************************************
//  * start/stop service functions
//  **************************************/

// function startWakeUpRecognition(){
//   console.log('<== config wakeword recognition..')
//   var voiceConfigProto = new matrixMalosBuilder.WakeWordParams;
//   voiceConfigProto.set_wake_word("MIA");
//   voiceConfigProto.set_lm_path("/home/pi/assets/9854.lm");
//   wakeword_config.set_dic_path("/home/pi/assets/9854.dic");
//   wakeword_config.set_channel(matrixMalosBuilder.WakeWordParams.MicChannel.channel8);
//   wakeword_config.set_enable_verbose(false)
//   sendConfigProto(wakeword_config);
// }

// function stopWakeUpRecognition(){
//   console.log('<== stop wakeword recognition..')
//   var wakeword_config = new matrixMalosBuilder.WakeWordParams;
//   wakeword_config.set_stop_recognition(true)
//   sendConfigProto(wakeword_config);
// }

// /**************************************
//  * Register wakeword callbacks
//  **************************************/

// var updateSocket = zmq.socket('sub')
// updateSocket.connect('tcp://' + creator_ip + ':' + (creator_wakeword_base_port + 3))
// updateSocket.subscribe('')

// updateSocket.on('message', function(wakeword_buffer) {
//   var wakeWordData = new matrixMalosBuilder.WakeWordParams.decode(wakeword_buffer);
//   console.log('==> WakeWord Reached:',wakeWordData.wake_word)
    
//     switch(wakeWordData.wake_word) {
//       case "MIA RING RED":
//         setEverloop(255, 0, 25, 0, 0.05)
//         break;
//       case "MIA RING BLUE":
//         setEverloop(0, 25, 255, 0, 0.05) 
//         break;
//       case "MIA RING GREEN":
//         setEverloop(0, 255, 100, 0, 0.05) 
//         break;
//       case "MIA RING ORANGE":
//         setEverloop(255, 77, 0, 0, 0.05) 
//         break;
//       case "MIA RING CLEAR":
//         setEverloop(0, 0, 0, 0, 0) 
//         break;
//     }
// });

// /**************************************
//  * Everloop Ring LEDs handler
//  **************************************/

// var ledsConfigSocket = zmq.socket('push')
// ledsConfigSocket.connect('tcp://' + creator_ip + ':' + creator_everloop_base_port /* config */)

// function setEverloop(r, g, b, w, i) {
//     var config = new matrixMalosBuilder.DriverConfig
//     config.image = new matrixMalosBuilder.EverloopImage
//     for (var j = 0; j < 35; ++j) {
//       var ledValue = new matrixMalosBuilder.LedValue;
//       ledValue.setRed(Math.round(r*i));
//       ledValue.setGreen(Math.round(g*i));
//       ledValue.setBlue(Math.round(b*i));
//       ledValue.setWhite(Math.round(w*i));
//       config.image.led.push(ledValue)
//     }
//     ledsConfigSocket.send(config.encode().toBuffer());
// }

// /**************************************
//  * sendConfigProto: build Proto message 
//  **************************************/

// function sendConfigProto(cfg){
//   var config = new matrixMalosBuilder.DriverConfig
//   config.set_wakeword(cfg)
//   configSocket.send(config.encode().toBuffer())
// }

// /**********************************************
//  ****************** MAIN **********************
//  **********************************************/

// startWakeUpRecognition();

