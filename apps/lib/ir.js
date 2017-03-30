var IR = {
  cmdResolve: null,
  brand: null,
  model: null,

  //TODO: support chaining methods or arrays
  /**
   * Does a lookup to see if the command is valid, if so, passes command to MOS.
   * Uses Promises to defer execution. 😎
   * @param {Object} options.brand - what maker ex. 'SONY' 
   * @param {Object} options.model - what device ex. '1337-D'
   */
  ir: function(options) {

    console.log('ir', options);

    IR.cmdPromise = new Promise(function(resolve, reject) {
      IR.cmdResolve = resolve;
      IR.cmdReject = reject;
    });

    if (options.hasOwnProperty('brand')) {
      IR.brand = options.brand.replace(/-./, '_').toLowerCase();
      IR.model = options.model.toUpperCase();
      var ext = '.lircd.conf';

      // https://storage.googleapis.com/assets.admobilize.com/lirc-remotes/sony/RM-AAU014.lircd.conf
      var url = ['https://storage.googleapis.com/assets.admobilize.com/lirc-remotes', IR.brand, IR.model + ext].join('/');
      // console.log(url);

      if (!IR.hasOwnProperty('cmds')) {
        require('https').get(url, function(res) {
          var status = res.statusCode;
          if (status !== 200) {
            IR.cmdReject('Request Failed: ' + url + ' ' + status);
          } else {
            var config = '';
            res.on('data', function(d) {
              config += d;
            });
            res.on('end', function() {

              // expose
              IR.config = config;
              var startI = config.indexOf('begin codes') + 11;
              var endI = config.indexOf('end codes');
              var codes = config.slice(startI, endI);
              IR.cmds = [];
              IR.codes = [];

              //kv lookup
              IR.cmdCodes = {};

              codes.split('\n').map(function(c) {
                //  BTN_VIDEO3               0x210C

                // clear empty lines
                if (_.isEmpty(c)) {
                  return;
                }
                // split code into word regions
                var re = /\w*/g;

                //strip empty space from array + first is cmd match
                var cmd = _.compact(c.match(re))[0];
                var code = _.compact(c.match(re))[1];
                IR.cmds.push(cmd);
                IR.codes.push(code);
                IR.cmdCodes[cmd] = code;

              });
              IR.cmdResolve();
            });
          }
        });
      } else {
        IR.cmdResolve(IR.cmds);
      }
    }

    return IR;
  },
  send: function(cmd) {
    console.log('[m]>cmd', cmd);
    IR.cmdPromise.then(function() {
      if (IR.cmds.indexOf(cmd) > -1) {
        process.send({
          type: 'ir-cmd',
          cmd: 'send',
          payload: {
            brand: IR.brand,
            model: IR.model,
            cmdCodes: IR.cmdCodes,
            command: cmd
          }
        });

      } else {
        console.error(cmd, 'is not a valid command', IR.cmds);
      }
    });
    IR.cmdReject.then(function(err) {
      console.error(err);
    });
  }
};
module.exports = IR;