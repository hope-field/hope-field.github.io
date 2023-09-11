//import Serial from "./serial.js";

let selectedDevice;

self.importScripts("serial.js");
//const serial = new Serial();

class Stimulator {
  constructor() {
      this.chufang = {};
      this._wave = [];
      this._amp = 80;
      this._freq = 100;
      this._offset = 0.0;
      this.ticks = 0;
      this.timeout = 20*60*1000/0.512;
      const br = 9600;//window.localStorage.getItem('baud');
      this._serialOptions = { baudRate: (br ? br : 9600), dataBits: 8, stopBits: 1, parity: 'even' ,bufferSize: 8192*4, flowcontrol:'hardware'};
      this._port = null;
      this._reader = null;
      this._textdecoder = new TextDecoder();
      this._writer = null;
      this._textencoder = new TextEncoder();

      this.recv = new Uint16Array(19531);

      this._bufferSize = 64;
      this._bufferPos = -1;
      this._buffer = [];
      this.func = null;
      this.status = 'stop';
      this.event = 'none';
      this.ts = 0;
      this.a = 1;
      this.c = 0.0;
      this.stat = 0;
      //this.state=['unsed', 'linked', 'playing', '']
      //this.startup();

      //this.fsm.start();
      //return this.fsm;
  }

  playing( ) {
    var todac = new Uint8Array(this._bufferSize);
    for (let index = 0; index < 1; index++) {
        if (this.ticks+this._bufferSize <= this._wave.length) {
            todac.set(this._wave.slice(this.ticks, this.ticks+this._bufferSize), 0);
            this.ticks += this._bufferSize;
        } else {
            todac.set(this._wave.slice(this.ticks, this._wave.length), 0)
            //this.ticks = 0;
            todac.set(this._wave.slice(0, this.ticks+this._bufferSize-this._wave.length), this._wave.length - this.ticks);
            this.ticks += this._bufferSize - this._wave.length;
        }

        this._writer.ready
        .then(async ()=> {
            return this._writer.write(todac);
            this.stat = todac.length;
            //resolve();
        }).then((len)=>{
            this.ts += this._bufferSize/2;
            //await sleep(2);
            //console.log(len);
        }).catch(r=>{this.stat = r});
        
    }
  }

  async playing2( ) {
    var todac = new Uint8Array(this._bufferSize);
    for (let index = 0; index < 1; index++) {
        if (this.ticks+this._bufferSize <= this._wave.length) {
            todac.set(this._wave.slice(this.ticks, this.ticks+this._bufferSize), 0);
            this.ticks += this._bufferSize;
        } else {
            todac.set(this._wave.slice(this.ticks, this._wave.length), 0)
            //this.ticks = 0;
            todac.set(this._wave.slice(0, this.ticks+this._bufferSize-this._wave.length), this._wave.length - this.ticks);
            this.ticks += this._bufferSize - this._wave.length;
        }

        await this._writer.ready
        .then(async ()=> {
            await this._writer.write(todac);
            this.stat = todac.length;
            //resolve();
        }).then((len)=>{
            this.ts += this._bufferSize/2;
            //await sleep(2);
            //console.log(len);
        }).catch(r=>{this.stat = r});
        
    }
  }

  async _connect(data) {
      if (this._port !== null && this._port.open) {
          if (this._reader !== null) {
              this._reader.cancel();
          }
          return;
      }

      this._port = null;
      //console.log('connecting');
      try {
          let devices;
          if ('serial' in navigator) { 
              devices = await navigator.serial.getPorts();
              
          } else if ('usb' in navigator) {
              devices = await serial.getPorts();
              //console.log('usb:', devices.getInfo().usbProductId);
             
          } else {
              console.log('neither serial nor usb is supported');
          }
          
          devices.forEach (async(device) => {
            if (device.getInfo().usbVendorId == data.vendorId
                && device.getInfo().usbProductId == data.productId) {
              this.stat = device.getInfo();
              this._port = device;
              await this._port.open(this._serialOptions);
              //self.postMessage({reply:device.getInfo()});
              this._looplay();
              return;
            }
          });
      } catch (e) {
          if (e.name === 'NotFoundError') {
              console.log('nothing selected - not connecting');
          } else {
              console.log(e);
          }                    
          this._port = null;
      }

  }

  async _looplay() {
      if (this._port == null) {
          await this._connect();
      }
      
      if (this._port) {
          try {
              //await this._port.open(this._serialOptions);
              //const signals = await this._port.getSignals();
              try {
                  //await this._read();
                  await this.ioloop();
              } catch {
                console.log('try io loop');
              }
              
              try {
                  await this._port.close();
              } catch {
                console.log('try port close');
              }
              
              this._port = null;

          } catch (e) {                        
              console.log(e);
          }
      } else {
          console.log('nothing port connect\n');
      }
  }

  pause() {
    var zeros = new Array(32);
    var dac0 = new Uint8Array(this._bufferSize);
    zeros.fill(0);
    dac0.set(zeros.map(v => (v+this.c))
                        .map(v=>Math.round(((16383*1.0866)/5)*(2.5-v)))
                        .flatMap(v=>[(v>>8)&0xFF, v&0xFF]), 0);
    
    this._writer.ready
            .then(async ()=> {
                return this._writer.write(dac0);
                //this.stat = todac.length;
                //resolve();
            }).then(()=>{
                //this.ts += this._bufferSize/2;
                //await sleep(2);
                //console.log(len);
            }).catch(r=>{this.stat = r});
  }

  async   ioloop() {

      let rcnt = 0;
      //await this._port.setsignals({dataTerminalReady: true});
      //await this._port.setsignals({requestToSend: true});
      //console.log(this._port.readable);
      //while(this._wave.length == 0 );
      //this.stat = 'ioloop:'+this._port.device_.opened;
      while (this._port.readable) {
          try {
            this._writer = this._port.writable.getWriter( );
            this._reader = this._port.readable.getReader( ); //{ mode: "byob" }

              while (true) {
                  await this._reader.read().then(async ({ done, value }) =>{
                      if (done) {
                          this._reader.releaseLock();
                          return;
                      }
                      //this.stat = 3;
                      if ((value.length > 2) && (rcnt + value.length < this._wave.length)) {
                          for(let i = 2; i < value.length; i += 2) {
                              this.recv[rcnt] = value[i]<<8|value[i+1];
                              rcnt++;
                          }
                          //this.recv.set(value.slice(2), rcnt);
                          //rcnt += (value.length - 2);
                          //console.log(value);
                      }
                      if (value[0] == 0xFF && this.func) {
                        await this.func();
                      }
                      
                  });
              }
              
          } catch (e) {
              console.log(e);  
          } finally {
              this._reader.releaseLock();
              this._writer.releaseLock();
              this.func = null;
          }
      }
  }

  ampchange(pct) {
      this._amp = pct;
      if (pct > 100)
          this._amp = 100;
      if (pct < 0)
          this._amp = 0;
      const valueType = Object.prototype.toString.call(this.chufang["waves_list"])
      if(this.chufang["waves_list"] != null) {
                  //let dacode = this.mA_2_DAC_write(txlist[j]*(-0.9298)+0.1795);
          console.time('map');
          this._wave = new Uint8Array (this.chufang["waves_list"]
          .map(v=>Math.round(((16383*1.0866)/5)*(2.5-(this.a*(v+this._offset)+this.c) * this._amp / 100 )))
          .flatMap(v=>[(v>>8)&0xFF, v&0xFF]));
      }
      //console.log(pct);
  }

  tick_callback(){
    if(this.ts >= this.timeout) {
        self.postMessage({reply:'timeout'});
    } else {
        self.postMessage({reply:'tick', timeline:this.ts});
    }
  }

  async tx_128_mA_values(listof128_values_in_mA)
  {
      var data_to_transmate=[];
      try {
        if(this.chufang["waves_list"] != null) {
            //let dacode = this.mA_2_DAC_write(txlist[j]*(-0.9298)+0.1795);
            console.time('map');
            this._wave = new Uint8Array (this.chufang["waves_list"]
            .map(v=>Math.round(((16383*1.0866)/5)*(2.5-(this.a*(v+this._offset)+this.c) * this._amp / 100 )))
            .flatMap(v=>[(v>>8)&0xFF, v&0xFF]));
        }
     } catch (error) {
         console.log(error);
     } finally {
         this._writer.releaseLock();
     }

  }

  async fetch_wave_data(url) {
    //console.log(url);
      await fetch(url).then(res=>{
          return res.json();
      }).then(res=>{
          this.chufang = res;
          this.ampchange(this._amp);
      }).catch(e =>{
        console.log(e);
        return e;
      });
  }
}

let stimulator = new Stimulator();
let _timer = null;

onmessage = async function(event) {
    //console.log('msg in:', event);
  switch(event.data.action) {
    // Open the device specified with vendorId and productId.
    case    'connect':
        //console.log(event.data);
        await stimulator._connect(event.data);
        self.postMessage({reply:'connected'});
        break;
    case    'play':
        //console.log(event.data);
        await setparam(event.data);
        stimulator.func = stimulator.playing;
        if (stimulator._port == null) {
            self.postMessage({reply:'null'});
        }
        if (_timer == null) {
            _timer = setInterval(() => {
                if(stimulator.ts < stimulator.timeout) {
                    self.postMessage({reply: 'tick', timeline: stimulator.ts});
                } else {
                    self.postMessage({reply:'timeout'});
                    clearInterval(_timer);
                    _timer = null;
                    stimulator.ts = 0;
                    stimulator.func = stimulator.pause;
                }
                
              }, 1000);
        }
        break;
    case    'pause':
        stimulator.func = stimulator.pause;
        if(_timer) {
            clearInterval(_timer);
            _timer = null;
        }
        break;
    case    'set':
        await setparam(event.data);
        self.postMessage({reply:'set-ok'});
        break;
    default:
        console.log(event.data);
        break;
  }
}

async function    setparam(json)
{
    console.log('setparam', json);
    if (('src' in json) && stimulator._url != json.src) {
        stimulator._url = json.src;
        await stimulator.fetch_wave_data(json.src);
    }
    if (('amp' in json) && stimulator._amp != json.amp) {
        stimulator._amp = json.amp;
        await stimulator.ampchange(json.amp);
    }
    if (('time' in json) && stimulator.timeout != json.time) {
        stimulator.timeout = json.time * 60 * 1000 / 0.512;
    }
    if(('offset' in json) && stimulator._offset != json.offset) {

    }
}

onerror = async function(e) {
    stimulator.postMessage({reply:'error', msg:e});
}
