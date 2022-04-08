/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of
 * the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in
 * writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
 * OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing
 * permissions and limitations under the License.
 */
'use strict';

var waves=["sin", "square", "triangle", "alpha", "facepump"];
var waves_list = [];
var g_amp = 0.0;
var g_freq = 0.0;
var g_offset = 0.0;
var ticks = 0;

//const serial = require(serial.js);

class SerialTerminal {
    constructor(connectButton, inputElem, outputDiv, enterBtn, numEntries, bufferSize) {
        this.connectButton = connectButton;
        this.inputElem = inputElem;
        this.outputDiv = outputDiv;
        this.enterBtn = enterBtn;
        this.numEntries = numEntries;
        this.selector = null;
        this.canvas = null;
        this.increse = document.getElementById('connectBtn2');
        this.decrese = document.getElementById('enterBtn2');

        const br = window.localStorage.getItem('baud');
        this._serialOptions = { baudRate: (br ? br : 9600), dataBits: 8, stopBits: 1, parity: 'none' };
        this._port = null;
        this._reader = null;
        this._textdecoder = new TextDecoder();
        this._writer = null;
        this._textencoder = new TextEncoder();
        this._outputTbl = this.outputDiv.children[0];
        const ts = window.localStorage.getItem('showTimestamps');
        this._showTimestamps = ts ? (ts === '1') : false;
        const th = window.localStorage.getItem('theme');
        this._theme = th ? th : 'lt';

        this.outputDiv.classList.add(this._theme);
        this.inputElem.classList.add(this._theme);                

        this._bufferSize = bufferSize === undefined ? 0 : bufferSize;
        this._bufferPos = -1;
        this._buffer = [];
        this._lastInputElemValue = '';
        this._lastRow = null;                
        this._lastRowComplete = true;

        this._commands = [
            { cmd: 'help', numargs: 0, func: this._help, onlyDisconnected: false, syntax: '.help', help: 'show this list' },                    
            { cmd: 'baud', numargs: 1, func: this._setBaud, onlyDisconnected: true, syntax: '.baud <rate>', help: 'set the baud rate' },
            { cmd: 'ts', numargs: 0, func: this._toggleTimestamps, onlyDisconnected: false, syntax: '.ts', help: 'toggle timestamps' },
            { cmd: 'clear', numargs: 0, func: this._clearOutput, onlyDisconnected: false, syntax: '.clear', help: 'clear the output' },
            { cmd: 'save', numargs: 0, func: this._save, onlyDisconnected: true, syntax: '.save', help: 'save to file' }, 
            { cmd: 'show', numargs: 1, func: this._show, onlyDisconnected: false, syntax: '.show', help: 'show var' },              
            { cmd: 'theme', numargs: 0, func: this._toggleTheme, onlyDisconnected: false, syntax: '.theme', help: 'toggle light/dark' }];

        //this._help();
        this.canvas = document.getElementById("gif");
        this.selector = document.getElementById("selectElem");
        waves.forEach(wave => {
            this.selector.options.add(new Option(wave, undefined));
        });

        //gen_waves("sin", g_amp, g_freq, g_offset);
        this.tryKeepScreenAlive(30);
        fetch(location+'sin.json').then(res=>{
            return res.json();
        }).then(res=>{
            waves_list = res["waves_list"];
            g_amp = res["amp"];
            g_freq= res["freq"];
            g_offset=res["offset"];
        });

        this.connectButton.addEventListener('click', e => {
            try {
                this._connect();

            } catch (e) {
                output.appendChild(e);
            }
        });

        this.increse.addEventListener('click', e => {
            try {
                //this._connect();
                if (g_amp >= 2.0) {
                    return;
                } else {
                    g_amp += 0.1;
                }
                let scale = g_amp / (g_amp - 0.1);
                for(let i = 0; i < waves_list.length; i++)  {
                    waves_list[i] = waves_list[i] * scale;
                }
            } catch (e) {
                output.appendChild(e);
            }
        });

        this.decrese.addEventListener('click', e => {
            try {
                //this._connect();
                if (g_amp <= 0.1) {
                    return;
                } else {
                    g_amp -= 0.1;
                }
                let scale = g_amp / (g_amp + 0.1);
                for(let i = 0; i < waves_list.length; i++)  {
                    waves_list[i] = waves_list[i] * scale;
                }
            } catch (e) {
                output.appendChild(e);
            }
        });

        this.inputElem.addEventListener('keyup', e => {                    
            if (e.keyCode === 13) {
                e.preventDefault();                        
                this._processInput();                        
            }
        }, false);

        this.inputElem.addEventListener('keydown', e => {
            switch (e.keyCode) {
                case 38:
                    if (this._bufferSize > 0 && this._bufferPos > -1) {
                        this._bufferPos = Math.max(0, this._bufferPos - 1);
                        this.inputElem.value = this._buffer[this._bufferPos];
                    }
                    break;
                case 40:
                    if (this._bufferSize > 0) {
                        this._bufferPos = Math.min(this._buffer.length, this._bufferPos + 1);
                        if (this._bufferPos === this._buffer.length) {
                            this.inputElem.value = '';
                        } else {
                            this.inputElem.value = this._buffer[this._bufferPos];
                        }
                    }
                    break;
                case 13:
                    if (this._bufferSize > 0 && this._lastInputElemValue !== this.inputElem.value) {
                        this._buffer.push(this.inputElem.value);
                        this._buffer.splice(0, Math.max(0, this._buffer.length - this._bufferSize));
                        this._lastInputElemValue = this.inputElem.value;
                    }
                    this._bufferPos = this._buffer.length;
                    break;
            }                    
        }, false);

        this.enterBtn.addEventListener('click', e => {                   
            this._processInput();                    
        }, false);

        this.enterBtn.addEventListener('touchstart', e => {                    
            return true;
        }, true);

        this.enterBtn.addEventListener('touchend', e => {
            e.preventDefault();
            e.stopPropagation();
            this._processInput();
            return false;
        }, true);

        this.selector.addEventListener("change", e=> {
            let form = this.selector.value;
            fetch(location+form+'.json').then(res=>{
                return res.json();
            }).then(res=>{
                waves_list = res["waves_list"];
                g_amp = res["amp"];
                g_freq= res["freq"];
                g_offset=res["offset"];
                console.log(waves_list);
            });
            //gen_waves(form, g_freq, g_amp, g_offset);
            //this.appendOutput("onChange");
            console.log("onchange"+this.selector.value);
            let x = 0;
            let ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.beginPath();
            ctx.moveTo(0,300);
            waves_list.forEach(e => {
                ctx.lineTo((x++)*10, e*1000);
                //console.log(x);
            });
            ctx.stroke();
        });
        
    }
    
    appendOutput(value, outclass, incomplete) {
        const valueType = Object.prototype.toString.call(value);

        let text = '';
        if (valueType === '[object String]') {
            text = value;
        }
        else {
            text = value.toString();
        }                

        const scroll = this.outputDiv.scrollHeight - this.outputDiv.scrollTop < this.outputDiv.clientHeight + 20;

        if (this._lastRowComplete || !outclass || outclass === 'outcmd') {                    
            this._lastRow = this._outputTbl.insertRow(-1);                    
            const newCell0 = this._lastRow.insertCell(0);
            const newCell1 = this._lastRow.insertCell(1);

            if (!outclass || outclass === 'outcmd') {
                newCell0.className = outclass ? outclass : 'outsyst';
                newCell0.colSpan = 2;
                newCell0.appendChild(document.createTextNode(text));
                newCell0.classList.add(this._theme);
                this._lastRowComplete = true;
            } else {
                newCell0.className = this._showTimestamps ? 'tsShow' : 'tsHide';
                newCell0.appendChild(document.createTextNode(this._getTimestamp()));
                newCell1.className = outclass;
                newCell1.appendChild(document.createTextNode(text));
                newCell1.classList.add(this._theme);
                this._lastRowComplete = incomplete !== true;
            }                    
        }
        else {
            this._lastRow.children[1].innerText += text;
            this._lastRowComplete = incomplete !== true;
        }

        while (this._outputTbl.rows.length > this.numEntries) {
            this._outputTbl.deleteRow(0);
        }

        if (scroll) {
            this.outputDiv.scrollTo({ left: 0, top: this.outputDiv.scrollHeight, behavior: 'auto' });
        }
                        
    }

    _getTimestamp() {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');
        const ms = now.getSeconds().toString().padStart(3, '0');
        return h + ':' + m + ':' + s + '.' + ms;
    }

    
    async _processInput() {
        if (this.inputElem.value.startsWith('.')) {
            const inpSplit = this.inputElem.value.split(' ');
            if (inpSplit.length > 0) {
                inpSplit[0] = inpSplit[0].substring(1);
                const command = this._commands.find(x => x.cmd === inpSplit[0] && x.numargs === inpSplit.length - 1);
                if (command) {
                    inpSplit.shift();
                    if (command.onlyDisconnected && this._port !== null && this._port.open) {
                        this.appendOutput('connected - cannot process this command');                                
                    } else {
                        await command.func.call(this, inpSplit);
                        this.inputElem.value = '';
                    }                           
                }
                else {
                    this.appendOutput('unknown command');
                }
            }                     
        } else if (this._port !== null && this._port.open) {
            try {
                await this._write(this.inputElem.value);
            } catch (e) {
                this.appendOutput(e);
            }
        } else {
            this.appendOutput('not connected - nothing sent');
        }                
    }
    

    async _connect() {
        if (this._port !== null && this._port.open) {
            if (this._reader !== null) {
                this._reader.cancel();
            }
            return;
        }

        this._port = null;

        try {
            if ("serial" in navigator) {                        
                this._port = await navigator.serial.requestPort();
            } else if ("usb" in navigator) {                        
                this._port = await serial.requestPort();
            } else {
                this.appendOutput('neither serial nor usb is supported');
            }
        } catch (e) {
            if (e.name === 'NotFoundError') {
                this.appendOutput('nothing selected - not connecting');
            } else {
                this.appendOutput(e);
            }                    
            this._port = null;
        }


        if (this._port != null) {
            try {
                await this._port.open(this._serialOptions);
                
                this.connectButton.children[0].src = 'img/white_36dp_stop.svg';
                this.appendOutput('port opened');
                //const signals = await this._port.getSignals();
                try {
                    await this._read();
                } catch {}
                
                try {
                    await this._port.close();
                } catch {}
                
                this._port = null;

                this.connectButton.children[0].src = 'img/white_36dp_play.svg';
                this.appendOutput('port closed');
            } catch (e) {                        
                this.appendOutput(e);
            }
        } else {
            //this.inputElem.options.add(new Option("not found device",undefined));
        }
    }

    async _read() {
        try {
        let text = '';

        this._reader = this._port.readable.getReader( ); //{ mode: "byob" }
        this._writer = this._port.writable.getWriter();
        let offset = 0;
        let buffer = new ArrayBuffer(1024);
        //const buffer = await readInto(startingAB);

        while (true) {
            const { value, done } = await this._reader.read( );
            if (done) {
                this.appendOutput("done"+done+"|"+value);
                break;
            }
            if (value.length) {
                
                var txlist = new Array(32);
                var todac = new Uint8Array(64);
                for(let j = 0; j < txlist.length; j++) {
                    txlist[j] = waves_list[(ticks + j) % waves_list.length];
                    let dacode = this.mA_2_DAC_write(txlist[j]*(-0.9298)+0.1795);
                    todac[2*j]=((dacode>>8)&0xFF);
                    todac[2*j+1]=(dacode&0xFF);
                }
                //this.appendOutput("todac"+todac.length+'\r\n');
                await this._writer.write(todac);
                //this._reader.read(this._port.readable.readableLength);
                /*let dacode = this.mA_2_DAC_write(0.5*(-0.9298)+0.1795);
                this._writer.write(dacode);*/
                /*txlist.forEach(async(it) =>{
                    let code = this.mA_2_DAC_write(it*(-0.9298)+0.1795);
                    await this._write(code);
                });*/
                //await this.tx_128_mA_values(txlist);
                ticks += txlist.length;
                if ((ticks % waves_list.length) === 0) {
                    ticks = 0;
                }
                //this.appendOutput(ticks +'\r\n', 'outserial', true);
                text = '';
                } else {
                    //this.appendOutput(value.length+'\r\n');
                }
            }
        } catch (e) {                               
            this.appendOutput(e);
        } finally {
            this._reader.releaseLock();
            this._writer.releaseLock();
        }
        
    }

    async _write(msg) {
        this._writer = this._port.writable.getWriter();

        try {
            const valueType = Object.prototype.toString.call(msg);

            if (valueType === '[object Uint8Array]' ||
                valueType === '[Promise Uint8Array]') {
                await this._writer.write(msg);
            } else {
                const encoded = this._textencoder.encode(msg);
                await this._writer.write(encoded);
                this.appendOutput('"' + msg + '" sent');
            }
        } catch (e) {
            this.appendOutput(e);
        }

        this._writer.releaseLock();
    }

    async _help(args) {
        this.appendOutput(' ');
        this.appendOutput('commands:');
        for (let i = 0; i < this._commands.length; i++) {
            this.appendOutput(' ' + this._commands[i].syntax.padEnd(12) + ' - ' + this._commands[i].help, 'outcmd');
        }
        this.appendOutput(' ');
    }

    async _show(args) {
        this.appendOutput(waves_list.length+'\r\n');
    }

    async _setBaud(args) {
        if (Number.isInteger(parseInt(args[0]))) {
            window.localStorage.setItem('baud', args[0]);
            this._serialOptions.baudRate = parseInt(args[0]);
            this.appendOutput('baud rate set to ' + this._serialOptions.baudRate);
            return;

        }
    }

    async _toggleTimestamps(args) {
        this._showTimestamps = !this._showTimestamps;
        window.localStorage.setItem('showTimestamps', this._showTimestamps ? '1' : '0');

        for (let i = 0; i < this._outputTbl.rows.length; i++) {
            if (!this._outputTbl.rows[i].cells[0].classList.contains('outsyst')) {
                if (this._outputTbl.rows[i].cells[0].classList.contains(this._showTimestamps ? 'tsHide' : 'tsShow')) {
                    this._outputTbl.rows[i].cells[0].classList.remove(this._showTimestamps ? 'tsHide' : 'tsShow');
                }
                this._outputTbl.rows[i].cells[0].classList.add(this._showTimestamps ? 'tsShow' : 'tsHide');
            }
        }
    }

    async _toggleTheme(args) {
        
        if (this.outputDiv.classList.contains(this._theme)) {
            this.outputDiv.classList.remove(this._theme);
        }

        if (this.inputElem.classList.contains(this._theme)) {
            this.inputElem.classList.remove(this._theme)
        }

        const outTds = this.outputDiv.querySelectorAll('td');
        for (let i = 0; i < outTds.length; i++) {
            if (outTds[i].classList.contains(this._theme)) {
                outTds[i].classList.remove(this._theme);
            }
        }

        this._theme = this._theme === 'lt' ? 'dk' : 'lt';

        this.outputDiv.classList.add(this._theme);
        this.inputElem.classList.add(this._theme)

        for (let i = 0; i < outTds.length; i++) {
            outTds[i].classList.add(this._theme);
        }

        window.localStorage.setItem('theme', this._theme);
    }

    async _save() {                
        const options = {
            types: [
                {
                    description: 'Text Files',
                    accept: {
                        'text/plain': ['.txt'],
                    },
                },
            ],
        };

        try {
            const fileHandle = await window.showSaveFilePicker(options);
            try {
                const writable = await fileHandle.createWritable();
                const contents = this.outputDiv.querySelectorAll('td');
                let contentString = '';
                for (let i = 0; i < contents.length; i++) {
                    contentString += contents[i].innerHTML + '\r\n';
                }
                await writable.write(contentString);
                await writable.close();
            } catch (e) {                        
                this.appendOutput(e);
            }
        } catch (ed) {
        }                                
    }

    async _clearOutput() {
        while (this._outputTbl.rows.length > 0) {
            this._outputTbl.deleteRow(0);
        }
    }          
    mA_2_DAC_write(value_in_mA)
    {
        if(value_in_mA > 2.002)
            value_in_mA = 2.001;
        if(value_in_mA < -2.002)
            value_in_mA = -2.001;
        let dacwrite = (Math.round(((16383*1.0866)/5)*(2.5-value_in_mA)));
        //console.log(dacwrite);
        return dacwrite;
    }

    async tx_128_mA_values(listof128_values_in_mA)
    {
        var data_to_transmate=[];
        /*listof128_values_in_mA.forEach(async(it) => {
            let code = this.mA_2_DAC_write(it*(-0.9298)+0.1795);
            await this._write(code);
        });*/
        try {
            this._writer = this._port.writable.getWriter();
            for (let index = 0; index < listof128_values_in_mA.length; index++) {
                let dacode = this.mA_2_DAC_write(listof128_values_in_mA[index]*(-0.9298)+0.1795);
                await this._writer.write(dacode);
            }
       } catch (error) {
            this.appendOutput(error.toString());
       } finally {
           this._writer.releaseLock();
       }

    }

    tryKeepScreenAlive(minutes) {
        if ("wakeLock" in navigator) {
            navigator.wakeLock.request("screen").then(lock => {
            setTimeout(() => lock.release(), minutes * 60 * 1000);
            });        
        } else {
            this.appendOutput("not support wakeLock"+'\r\n');
        }
    }
}

//tryKeepScreenAlive(10);
  
let serialTerminal = new SerialTerminal(
    document.getElementById('connectBtn'),
    document.getElementById('inputElem'),
    document.getElementById('outputDiv'),
    document.getElementById('enterBtn'),
    128,
    64
);

function fetchformula()
{
    fetch(location+form+'.json').then(res=>{
        return res.json();
    }).then(res=>{
        waves_list = res["waves_list"];
        g_amp = res["amp"];
        g_freq= res["freq"];
        g_offset=res["offset"];
        console.log(waves_list);
    });
}

function gen_waves(form, freq, amp, offset)
{
    var samples_per_cycle = (Math.round(1/((freq)*0.000512)));
    waves_list.splice(0);

    if(form === waves[0]) {
        for (let i = 0; i < samples_per_cycle; ++i) {
            waves_list[i]= parseFloat((amp*(Math.sin(2*(Math.PI)*(i/samples_per_cycle))) + offset).toFixed(5));
        }
        waves_list[samples_per_cycle - 1] = (waves_list[0] + waves_list[samples_per_cycle - 2])/2.0;
    }

    if (form === waves[1]) {
        for (let i = 0; i < samples_per_cycle; i++) {
            if (i < samples_per_cycle / 2) {
                waves_list[i] = ( amp + offset);           
            }
            if ( i >= samples_per_cycle / 2) {
                waves_list[i]=( (-1)*amp + offset);           
            }
        }
    }

    if (form === waves[2]) {
        for (let i = 0; i < samples_per_cycle; i++) {
            waves_list[i]=0.0;
        }
    }
    if (form === waves[3]) {
        for (let i = 0; i < samples_per_cycle; i++) {
            waves_list[i] = offset;

            if ((i >= Math.round(samples_per_cycle*150/1000)) && (i < Math.round(samples_per_cycle*175/1000))) {
                waves_list[i] = (-1)*amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*250/1000)) && (i < Math.round(samples_per_cycle*300/1000))) {
                waves_list[i] = amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*350/1000)) && (i < Math.round(samples_per_cycle*425/1000))) {
                waves_list[i] = (-1)*amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*450/1000)) && (i < Math.round(samples_per_cycle*550/1000))) {
                waves_list[i] = amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*550/1000)) && (i < Math.round(samples_per_cycle*650/1000))) {
                waves_list[i] = (-1)*amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*675/1000)) && (i < Math.round(samples_per_cycle*750/1000))) {
                waves_list[i] = amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*800/1000)) && (i < Math.round(samples_per_cycle*850/1000))) {
                waves_list[i] = (-1)*amp + offset;
            }
            if ((i >= Math.round(samples_per_cycle*925/1000)) && (i < Math.round(samples_per_cycle*950/1000))) {
                waves_list[i] = amp + offset;
            }
            if ((i === Math.round(samples_per_cycle*50/1000))) {
                waves_list[i] = (-1)*amp + offset;
            }
            
        }
    }
    if (form === waves[4]) {
        for (let i = 0; i < samples_per_cycle; i++) {
            waves_list[i] = offset;
            if ( !(i % 58)) {
                waves_list[i++] = (-1)*amp + offset;
                waves_list[i] = amp + offset;
            }
        }
    }
    waves_list.length = samples_per_cycle;
}

navigator.serial.addEventListener('connect', event => {
    // Add event.device to the UI.
    let form = serialTerminal.selector.value;
    //gen_waves(form, g_freq, g_amp, g_offset);
    console.log(" serial connect");
});
  
navigator.serial.addEventListener('disconnect', event => {
    // Remove event.device from the UI.
    console.log("disconnect");
});

navigator.usb.addEventListener('connect', event => {
    // Add event.device to the UI.
    let form = serialTerminal.selector.value;
    //gen_waves(form, g_freq, g_amp, g_offset);
    console.log("usb connect");
});
  
navigator.usb.addEventListener('disconnect', event => {
    // Remove event.device from the UI.
    console.log("disconnect");
});