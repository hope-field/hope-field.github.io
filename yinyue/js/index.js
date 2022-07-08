'use strict';
// 一些零碎的交互效果
var container = document.querySelector('.container');
var innerHeight = window.innerHeight;
container.style.height = `${innerHeight}px`;

var grey = document.querySelector('.mask-grey');
var list = document.querySelector('.music-list');
var list_btn = document.querySelector('.list-icon');
var list_dark_btn = document.querySelector('.icons .list');
var fang = {};

if ('serial' in navigator) {
    navigator.serial.addEventListener('connect', event => {
        
        //gen_waves(form, g_freq, g_amp, g_offset);
        console.log(" serial connect");
    });
    
    navigator.serial.addEventListener('disconnect', event => {
        // Remove event.device from the UI.
        console.log("disconnect");
    });
   
}

list_btn.addEventListener('click', () => {
    list.classList.remove('dark');
    list.classList.add('on');
    grey.classList.add('on');
})
list.querySelector('.close').addEventListener('click', () => {
    list.classList.remove('on');
    grey.classList.remove('on');
})
list_dark_btn.addEventListener('click', () => {
    list.classList.add('on', 'dark');
    grey.classList.add('on');
})

var section = document.querySelector('section');
var list_wrap = document.querySelector('.list-wrap');
var add_music = document.querySelector('.add-music');
var cancel_btn = document.querySelector('.cancel');
var singer_back = document.querySelector('.singer-back');

list_wrap.addEventListener('click', (e) => {
    if ( e.target.matches('.ellipsis i') ) {
        add_music.classList.add('slide');
        grey.classList.add('on');
    }
    if ( e.target.matches('.singer-li, .singer-li *') ) {
        section.classList.add('switch');
    }
})
singer_back.addEventListener('click', () => {
    section.classList.remove('switch');
})
cancel_btn.addEventListener('click', () => {
    add_music.classList.remove('slide');
    grey.classList.remove('on');
})

var avatar = document.querySelector('.foo .song-pic i');
var blur = document.querySelector('.mask-blur');
var blur_back = document.querySelector('.blur-back');

avatar.addEventListener('click', () => {
    blur.classList.add('show');
})
blur_back.addEventListener('touchstart', () => {
    blur.classList.remove('show');
})

var search_input = document.querySelector('.search_input');

search_input.addEventListener('focus', () => {
    search_input.classList.add('active');
})
search_input.addEventListener('blur', () => {
    search_input.classList.remove('active');
})

/* ----------------- 正式开始实现播放器效果 ------------------- */

// audioElement
var player = document.querySelector('.player-fuc .audio');

function audioPlayer() {

    // 播放暂停事件
    var btn_big_icon = document.querySelector('.icons > i:nth-of-type(3)');
    var btn_small = document.querySelector('.circle');
    var btn_small_icon = btn_small.querySelector('i.btn');
    
    btn_small.addEventListener('click', toggle);
    btn_big_icon.addEventListener('click', toggle);

    function toggle(e) {
        var icon = e.target.matches('.circle, .circle *') ? btn_small_icon : btn_big_icon;
        if ( icon.classList.contains('pause') ) {
            player.pause();
            btn_small_icon.classList.remove('pause');
            btn_big_icon.classList.remove('pause');
            stimulator.pause();
        } else {
            player.play();
            btn_small_icon.classList.add('pause');
            btn_big_icon.classList.add('pause');
            //if (stimulator._wave.length < 10) {
            //    stimulator.fetch_wave_data('alpha.json');
            //} 

            if (stimulator.func == null) {
                stimulator._looplay();
                stimulator.func = stimulator._looplay;
            } else {
                stimulator.status = 'playing';
            }
        }
    }

    // 进度条事件
    var progress = document.querySelector('.music-progress');
    var progress_bar = document.querySelector('.progress-bar');
    var progress_box = document.querySelector('.progress-tracker');
    var progress_handler = document.querySelector('.progress-handler');
    var current_time = document.querySelector('.music-progress .present');
    var total_time = document.querySelector('.music-progress .total');
    var cir_right = document.querySelector('.circle-right');
    var cir_left = document.querySelector('.circle-left');
    var rotate_wrap = document.querySelector('.circle-pic');
    //调幅
    var btn_amp = document.getElementById('show_amp');
    var v_amp = document.getElementById('amp_v');
    //player.addEventListener('timeupdate', updateProgress);
    player.addEventListener('loadedmetadata', function duration() {
        //total_time.textContent = formatTime(player.duration);
    })
    player.addEventListener('playing', () => {
        btn_big_icon.classList.add('pause');
        btn_small_icon.classList.add('pause');
    })
    progress.addEventListener('touchstart', (e) => {
        progress.addEventListener('touchmove', rewind);
        progress.addEventListener('touchend', (e) => {
            progress.removeEventListener('touchmove', rewind);
        });
    })

    btn_amp.addEventListener('input', (e)=>{
        stimulator.ampchange(btn_amp.value);
        v_amp.innerHTML = btn_amp.value;
        tryKeepScreenAlive(100 - btn_amp.value + 20);
        //console.log(btn_amp.value);
    })

    let ps = setInterval(() => {
        var current = stimulator.ts * 0.512 / 1000;
        var ratio = current /( Number(total_time.textContent.split(':')[0])*60 + Number(total_time.textContent.split(':')[1]));
        var percent = ratio * 100;
        var movement = ratio * progress_box.clientWidth;
        if (ratio >= 1) {
            current = 0;
            percent = 0;
            movement = 0;
            clearInterval(ps);
        }
        progress_bar.style.width = percent + '%';
        progress_handler.style.cssText = `transform: translate3d(${movement}px,0,0);`;
        current_time.textContent = formatTime(current);
        //progressRotate(ratio);
        //autoRotate();
    }, 1000);

    function inRange(e) {
        var rect = progress_box.getBoundingClientRect();
        var min = rect.left;
        var max = min + progress_box.offsetWidth;
        var touch = e.targetTouches[0];
        if ( touch.clientX < min || touch.clientX > max ) { return false };
        return true;
    }

    function getCoefficient(e) {
        var rect = progress_box.getBoundingClientRect();
        var touch = e.targetTouches[0];
        var offsetX = touch.clientX - rect.left;
        var width = progress_box.clientWidth;
        var K = offsetX / width;
        return K;
    }

    function rewind(e) {
        if ( inRange(e) ) {
            player.currentTime = player.duration * getCoefficient(e);
        }
    }

    function updateProgress() {
        var current = player.currentTime;
        var ratio = current / player.duration;
        var percent = ratio * 100;
        var movement = ratio * progress_box.clientWidth;
        progress_bar.style.width = percent + '%';
        progress_handler.style.cssText = `transform: translate3d(${movement}px,0,0);`;
        current_time.textContent = formatTime(current);
        progressRotate(ratio);
        autoRotate();
    }

    function formatTime(time) {
        var min = Math.floor(time / 60);
        var sec = Math.floor(time % 60);
        return (min < 10? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
    }

    function progressRotate(ratio) {
        var angle = Math.floor(ratio * 360);
        cir_left.style.cssText = `transform: rotate(0deg)`;
        if (angle >= 180) {
            cir_right.style.cssText = `transform: rotate(0deg);background: #b2dedd;`;
            cir_left.style.cssText = `transform: rotate(${angle-180}deg)`;
        } else {
            cir_right.style.cssText = `transform: rotate(${angle}deg);`;
        }
    }

    function autoRotate() {
        var rotate_pic = rotate_wrap.firstChild;
        if (player.paused) {
            var itransform = getComputedStyle(rotate_pic).transform;
            var ctransform = getComputedStyle(rotate_wrap).transform;
            rotate_wrap.style.transform = ctransform == 'none' ? itransform : itransform.concat('', ctransform);
            rotate_pic.classList.remove('animate');
        } else {
            rotate_pic.classList.add('animate');
        }
    }

}
audioPlayer();

// 治疗api
class Stimulator {
    constructor() {
        this.chufang = {};
        this._wave = [];
        this._amp = 80;
        this._freq = 100;
        this._offset = 0;
        this.ticks = 0;
        const br = window.localStorage.getItem('baud');
        this._serialOptions = { baudRate: (br ? br : 9600), dataBits: 8, stopBits: 1, parity: 'none' };
        this._port = null;
        this._reader = null;
        this._textdecoder = new TextDecoder();
        this._writer = null;
        this._textencoder = new TextEncoder();

        this._bufferSize = 0;
        this._bufferPos = -1;
        this._buffer = [];
        this.func = null;
        this.status = 'stop';
        this.event = 'none';
        this.ts = 0;
        //this.state=['unsed', 'linked', 'playing', '']
        //this.startup();

        //this.fsm.start();
        //return this.fsm;
    }

    async   playing(event) {
        var func = this.playing;
        switch (event) {
            case 'stop':
                func = this.pause;
                break;
        
            default:
                await new Promise( (resolve) =>{
                    let timer = setInterval(() =>{
                        if(this.haveGroupList){
                            clearInterval(timer)
                            resolve(true)
                        }
                    },100)});
                break;
        }
        return func;
    }

    async   startup() {
        var func2 = null;
        var i = 10;
        while (this.func) {
            func2 = await this.func(this.event);
            this.event = 'stop';
            if (this.func != func2 ) {
                this.func = func2;
                console.log('transition');
            }
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
                console.log('neither serial nor usb is supported');
            }
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

        if (this._port != null) {
            try {
                await this._port.open(this._serialOptions);
                
                //const signals = await this._port.getSignals();
                try {
                    //await this._read();
                    await this.ioloop();
                } catch {}
                
                try {
                    await this._port.close();
                } catch {}
                
                this._port = null;

            } catch (e) {                        
                console.log(e);
            }
        } else {
            console.log('nothing port connect\n');
        }
    }

    async pause(event) {
        this.status = 'stop';
    }

    processreader({ done, value }) {
        if (done) {
                return;
        }

        switch (this.status) {
            case 'playing':
                var todac;
                
                if (this.ticks+64 <= this._wave.length) {
                    todac = new Uint8Array(this._wave.slice(this.ticks, this.ticks+64));
                    this.ticks += 64;
                } else {
                    todac = new Uint8Array([this._wave.slice(this.ticks, this._wave.length), this._wave.slice(0, this.ticks+64-this._wave.length)].flat());
                    this.ticks = this.ticks+64-this._wave.length;
                }

                this._writer.write(todac);

                break;
            case 'stop':
                var zeros = new Uint16Array(32);
                var todac = zeros.map(v => (-0.9298*v+0.1795))
                    .map(v=>Math.round(((16383*1.0866)/5)*(2.5-v)))
                    .flatMap(v=>[(v>>8)&0xFF, v&0xFF]);
                this._writer.write(todac);
                break;
            default:
                console.log('processreader');
                break;
        }
    //await this.handlemsg(msgin);
    //return this._reader.read().then(processreader);
    }

    async   ioloop() {
        try {
            this._reader = this._port.readable.getReader( ); //{ mode: "byob" }
            this._writer = this._port.writable.getWriter();
            var todac = new Uint8Array(64);
            var zeros = new Array(32);
            var dac0 = new Uint8Array(64);
            zeros.fill(0);
            dac0.set(zeros.map(v => (-0.9298*v+0.1795))
                                .map(v=>Math.round(((16383*1.0866)/5)*(2.5-v)))
                                .flatMap(v=>[(v>>8)&0xFF, v&0xFF]), 0);
            this.status = 'playing';

            while (true) {
                await this._reader.read().then(({ done, value }) =>{
                    if (done) {
                        return;
                    }
            
                    switch (this.status) {
                        case 'playing':
                            
                            if (this.ticks+64 <= this._wave.length) {
                                todac.set(this._wave.slice(this.ticks, this.ticks+64), 0);
                                this.ticks += 64;
                            } else {
                                todac.set(this._wave.slice(this.ticks, this._wave.length), 0)
                                todac.set(this._wave.slice(0, this.ticks+64-this._wave.length), this._wave.length - this.ticks);
                                this.ticks = this.ticks+64-this._wave.length;
                            }
            
                            this._writer.write(todac);
                            this.ts += 32;
                            break;
                        case 'stop':

                            this._writer.write(dac0);

                            break;
                        default:
                            //console.log('processreader');
                            break;
                    }
                });
            }
            
                
        } catch (e) {     
            console.log(e);                          
        } finally {
            this._reader.releaseLock();
            this._writer.releaseLock();
            this.func = null;
            this.status = null;
        }
    }

    async handlemsg(value) {
        if (value.length) {
                    
            var txlist = new Array(32);
            var todac = new Uint8Array(64);
            for(let j = 0; j < txlist.length; j++) {
                txlist[j] = this._wave[(this.ticks + j) % this._wave.length];
                let dacode = this.mA_2_DAC_write(txlist[j]*(-0.9298)+0.1795);
                todac[2*j]=((dacode>>8)&0xFF);
                todac[2*j+1]=(dacode&0xFF);
            }

            this._wave.map(x=>{});
            await this._writer.write(todac);
            this.ticks += txlist.length;

            if ((this.ticks % this._wave.length) === 0) {
                this.ticks = 0;
            }

        } else {
            console.log(value.length+'\r\n');
        }

        return  todac;
    }

    async _read() {
        try {
            this._reader = this._port.readable.getReader( ); //{ mode: "byob" }
            this._writer = this._port.writable.getWriter();
            let offset = 0;
            let buffer = new ArrayBuffer(1024);

            while (true) {
                const { value, done } = await this._reader.read( );
                if (done) {
                    break;
                }
                if (value.length) {
                
                    var txlist = new Array(32);
                    var todac = new Uint8Array(64);
                    for(let j = 0; j < todac.length; j++) {
                        todac[j]=this._wave[(this.ticks+j)%this._wave.length];
                    }
                    await this._writer.write(todac);
                    this.ticks += todac.length;
                    if ((this.ticks % this._wave.length) === 0) {
                        this.ticks = 0;
                    }
                    //console.log(this.ticks +'\r\n', 'outserial', true);
                    //text = '';
                } else {
                        console.log(value.length+'\r\n');
                }
            }
        } catch (e) {     
            console.log(e);                          
        } finally {
            this._reader.releaseLock();
            this._writer.releaseLock();
        }
        
    }

    async handlerequest(stream) {
        try {
            this._writer = this._port.writable.getWriter();
            let offset = 0;
            let buffer = new ArrayBuffer(1024);
            if (value.length) {
                
                var txlist = new Array(32);
                var todac = new Uint8Array(64);
                for(let j = 0; j < txlist.length; j++) {
                    txlist[j] = this._wave[(this.ticks + j) % this._wave.length];
                    let dacode = this.mA_2_DAC_write(txlist[j]*(-0.9298)+0.1795);
                    todac[2*j]=((dacode>>8)&0xFF);
                    todac[2*j+1]=(dacode&0xFF);
                }
                await this._writer.write(todac);
                this.ticks += txlist.length;
                if ((this.ticks % this._wave.length) === 0) {
                    this.ticks = 0;
                }
                //console.log(this.ticks +'\r\n', 'outserial', true);
                text = '';
                } else {
                    console.log(value.length+'\r\n');
                }
        } catch (e) {
            console.log(e);
        } finally {
            this._writer.releaseLock();
        }
    }

    _write(msg) {
        this._writer = this._port.writable.getWriter();

        try {
            const valueType = Object.prototype.toString.call(msg);

            if (valueType === '[object Uint8Array]' ||
                valueType === '[Promise Uint8Array]') {
                this._writer.write(msg);
            } else {
                const encoded = this._textencoder.encode(msg);
                this._writer.write(encoded);
            }
        } catch (e) {
            console.log(e);
        }

        this._writer.releaseLock();
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
            this._wave = new Uint8Array(this.chufang["waves_list"]
            .map(v=>Math.round(((16383*1.0866)/5)*(2.5-(-0.9298*v+0.1795) * this._amp / 100)))
            .flatMap(v=>[(v>>8)&0xFF, v&0xFF]));
            console.timeEnd('map');
        }
        //console.log(pct);
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
           console.log(error);
       } finally {
           this._writer.releaseLock();
       }

    }

    fetch_wave_data(url) {
        fetch(location+url).then(res=>{
            return res.json();
        }).then(res=>{
            this.chufang = res;
            this.ampchange(80);
        });
    }
}
//定时器
function tryKeepScreenAlive(minutes) {
    if ("wakeLock" in navigator) {
        navigator.wakeLock.request("screen").then(lock => {
        setTimeout(() => lock.release(), minutes * 60 * 1000);
        }); 
    } else {
        console.log("not support wakeLock"+'\r\n');
    }
}

var stimulator = new Stimulator();
stimulator.fetch_wave_data('chufang/alpha.json');
// 音乐池
class MusicPool {
    constructor() {
        this.musicList = [
            {
                mid: '002I0bOa4CT9Qc',
                pic: 'https://p2.music.126.net/O0kJwOEhpHfFo5V4mQVrPg==/109951163278435685.jpg',
                name: '安思定1',
                singer: '国际电医院1',
                url: 'music/松たか子 (松隆子) - 夢のしずく (梦的点滴).mp3',
                cf: 'chufang/alpha.json'
            }
        ];
    }
    getMusicList() {
        return this.musicList;
    }
    addMusic(map) {
        this.musicList.push(map);
    }
    deleteMusic(key) {
        var trash =
        this.musicList.find((map, index) => {
            if (map.mid == key) {
                return this.musicList.splice(index, 1);
            }
        })
        trash = null;
    }
    emptyMusicList() {
        this.musicList = [];
    }
    findMusic(key, n) {
        var list = this.musicList;
        var last = list.length -1;
        var music;
        this.musicList.find((map, index) => {
            if (map.mid == key) {
                if (n == 1) {
                    map = index == last ? list[0] : list[index+1];
                }
                if (n == -1) {
                    map = index == 0 ? list[last] : list[index-1];
                }
                music = map;
            }
        })
        return music;
    }
    randomMusic() {
        var max = this.musicList.length -1;
        var rand = Math.random();
        var num = Math.round(rand * max);
        var map = this.musicList[num];
        return map;
    }
}

// 初始化音乐池
var pool = new MusicPool();

// 前进后退、播放顺序以及歌单的交互逻辑
var prev = document.querySelector('.icons .prev');
var next = document.querySelector('.icons .next');
var btn_big_icon = document.querySelector('.icons > i:nth-of-type(3)');
var btn_small_icon = document.querySelector('.circle i.btn');
var order = document.querySelector('.icons i:first-child');
var p_name = document.querySelector('.player-info .p-name');
var p_singer = document.querySelector('.player-info .p-singer span');
var p_pic = document.querySelector('.circle-pic i');
var s_name = document.querySelector('.foo .song-name');
var s_singer = document.querySelector('.foo .singer');
var s_pic = document.querySelector('.foo .song-pic i');
var self_wrap = document.querySelector('.self-wrap');
var self_songs = self_wrap.querySelectorAll('.song-info');
var warning = document.querySelector('.warning');

player.addEventListener('ended', checkOrder);
prev.addEventListener('click', decreseamp);
next.addEventListener('click', increseamp);

// 判断此时属于哪种播放顺序从而确定如何执行下一步
function checkOrder() {
    var key = player.getAttribute('mid');
    var type = order.getAttribute('class');
    if ( type == 'loop' ) {
        var { mid, name, pic, singer, url ,cf} = pool.findMusic(key);
    }
    if ( type == 'circle' || type == null ) {
        var { mid, name, pic, singer, url ,cf} = this == prev ? pool.findMusic(key, -1) : pool.findMusic(key, 1);
    }
    if ( type == 'random' ) {
        var { mid, name, pic, singer, url ,cf} = pool.randomMusic();
    }
    change(mid, name, pic, singer, url);
    //stimulator.fetch_wave_data(cf);//todo
}

function increseamp() {
    stimulator.offset += 10;
    //console.log("+");
}

function decreseamp() {
    stimulator.offset -= 10;
    //console.log("-");
}
// 最后一步歌曲信息的改变
function change(mid, name, pic, singer, url, type) {
    if ( !judge(type, mid, name, singer) ) { return };
    refresh(mid, name, pic, singer, url);
    player.play();
}

// 歌曲切换时相应图片文字的改变
function refresh(mid, name, pic, singer, url) {
    p_name.textContent = name;
    s_name.textContent = name;
    p_singer.textContent = singer;
    s_singer.textContent = singer;
    p_pic.style.cssText = `background-image:url(${pic})`;
    s_pic.style.cssText = `background-image:url(${pic})`;
    showActiveMusic(mid);
    player.setAttribute('mid', mid);
    player.setAttribute('title', name);
    player.setAttribute('src', url);
}

/**
 *
 * @param {*} type  判断以哪种方式对歌曲进行操作
 *  repeat: 若歌单中有该歌曲则只显示播放页不请求该歌曲
 *  lowerPlay: 请求歌曲, 添加到歌单, 播放歌曲但不显示播放页
 *  onlyList: 请求歌曲, 添加到歌单
 *  outerPlay: 请求歌曲, 添加到歌单, 播放歌曲且显示播放页
 *
 */
function judge(type, mid, name, singer) {
    if ( type == 'repeat' ) {
        blur.classList.add('show');
    }
    else if ( type == 'lowerPlay') {
        addToMusicList(mid, name, singer);
        saveMusicListToCache();
    }
    else if ( type == 'onlyList' ) {
        addToMusicList(mid, name, singer);
        saveMusicListToCache();
        return false;
    }
    else if ( type == 'outerPlay' ) {
        blur.classList.add('show');
        addToMusicList(mid, name, singer);
        saveMusicListToCache();
    } else {
        p_pic.parentNode.parentNode.classList.add('scale-once');
        setTimeout(() => { p_pic.parentNode.parentNode.classList.remove('scale-once') }, 500);
    }
    return true;
}

// 添加到歌单
function addToMusicList(mid, name, singer) {
    var html =
    `
    <li class="self-song">
        <div class="song-info" song_mid=${mid}>
            <span class="song-name">${name}</span>
            <span class="singer">- <span>${singer}</span></span>
            <div class="beat">
                <span class="one"></span>
                <span class="two"></span>
                <span class="three"></span>
            </div>
        </div>
        <div class="close-icon"><i></i></div>
    </li>
    `
    self_wrap.insertAdjacentHTML('beforeEnd', html);
}

// 当前播放歌曲高亮
function showActiveMusic(mid) {
    self_wrap.querySelectorAll('.song-info').forEach((ele) => {
        var li = ele.parentNode;
        li.classList.remove('active');
        var song_mid = ele.getAttribute('song_mid');
        if ( song_mid == mid ) {
            li.classList.add('active');
        }
    })
}

// 点击播放顺序按钮切换
(() => {
    function formatTime(time) {
        var min = Math.floor(time / 60);
        var sec = Math.floor(time % 60);
        return  min + ':' + (sec < 10 ? '0' + sec : sec);
    }
    var i = 0;
    var classLists = ['loop', 'random','circle'];
    var total_time = document.querySelector('.music-progress .total');
    order.addEventListener('click', () =>{
        i = i == 3 ? 0 : i;
        order.className = classLists[i];
        order.classList.contains('loop') ? player.setAttribute('loop', 'loop') : player.removeAttribute('loop');
        i++;//i * 20 i=1/2/3
        total_time.textContent = formatTime(i*20*60);
        //stimulator.tryKeepScreenAlive(i*20);    //todo
    })
})()

// 歌单中播放音乐或删除音乐
self_wrap.addEventListener('click', debounce(playMusic, 1000, true));
self_wrap.addEventListener('click', debounce(deleteMusic, 1000, true));

function playMusic(e) {
    if ( e.target.matches('.song-info, .song-info *') ) {
        var li = findParent(e.target, 'self-song');
        var key = li.querySelector('.song-info').getAttribute('song_mid');
        var { mid, name, pic, singer, url ,cf} = pool.findMusic(key);
        change(mid, name, pic, singer, url);
        stimulator.fetch_wave_data(cf);
    }
}

function deleteMusic(e) {
    if ( e.target.matches('.close-icon, .close-icon i') ) {
        var li = findParent(e.target, 'self-song');
        var key = li.querySelector('.song-info').getAttribute('song_mid');
        var mid_now = player.getAttribute('mid');
        if ( key == '001r8VMR24xJHa' ) {
            warning.textContent = '默认歌曲不能删除哦^_^';
            warning.classList.add('on');
            setTimeout(() => { warning.classList.remove('on') }, 2000);
            return;
        }
        if ( key == mid_now ) {
            warning.textContent = '正在播放的歌曲不能删除哦^_^';
            warning.classList.add('on');
            setTimeout(() => { warning.classList.remove('on') }, 2000);
            return;
        }
        pool.deleteMusic(key);
        saveMusicListToCache();
        li.classList.add('disappear');
        setTimeout(() => { li.outerHTML = '' }, 500);
    }
}

// 请求搜索后的数据并渲染
var search_box = document.querySelector('.search_input');
var list_wrap = document.querySelector('.list-wrap');

search_box.addEventListener('blur', reqSearchData);

function reqSearchData() {
    var keyword = htmlEncode(search_box.value);
    if ( keyword == '' ) {
        list_wrap.innerHTML = '';
        return;
    }
    var data = { keyword: keyword };
    $.ajax({
        url: location+'db.json',
        method: 'GET',
        data: data
    }).then(res => {
        if (res.fail) { return };
        res[0].pic ? renderSinger(res) : renderSong(res);
    }).catch(err => console.log(err));
}

function renderSinger(res) {
    list_wrap.innerHTML = '';
    for ( var data of res ) {
        var { singer_mid, name, pic } = data;
        var li = document.createElement('li');
        li.classList.add('singer-li');
        var html =
        `
        <div class="singer-info">
            <div class="singer-pic">
                <i singer_mid=${singer_mid}></i>
            </div>
            <div class="singer-name">${name}</div>
        </div>
        <div class="check-singer">
        </div>
        `
        li.innerHTML = html;
        list_wrap.appendChild(li);
        document.querySelectorAll('.singer-pic i').forEach((ele) => {
            if ( ele.getAttribute('singer_mid') == singer_mid ) {
                ele.style.cssText =`background-image:url(${pic})`;
            }
        })
    }
}

function renderSong(res) {
    list_wrap.innerHTML = '';
    var fragment = document.createDocumentFragment();
    for ( var song of res ) {
        var { song_mid, name, singer } = song;
        var li = document.createElement('li');
        li.classList.add('song');
        var html =
        `
        <div class="song-info" song_mid=${song_mid}>
            <p class="song-name">${name}</p>
            <p class="singer">${singer}</p>
        </div>
        <div class="ellipsis">
            <i></i>
        </div>
        `
        li.innerHTML = html;
        fragment.appendChild(li);
    }
    list_wrap.appendChild(fragment);
}

// 主页点击歌曲或歌手之后的逻辑
list_wrap.addEventListener('click', wardsAction);

function wardsAction(e) {
    if ( e.target.matches('.song-info, .song-info *') ) {
        var li = findParent(e.target, 'song');
        var song_mid = li.querySelector('.song-info').getAttribute('song_mid');
        reqMusicData(song_mid);
    }
    if ( e.target.matches('.singer-info, .singer-info *') ) {
        var li = findParent(e.target, 'singer-li');
        var singer_mid = li.querySelector('.singer-pic i').getAttribute('singer_mid');
        reqSingerData(singer_mid);
    }
}

// 请求音乐数据并渲染
function reqMusicData(song_mid, type = 'outerPlay') {
    if ( checkPool(song_mid) ) { return };
    var data = {
        song_mid: song_mid
    }
    $.ajax({
        url: 'lists/'+song_mid+'.json',
        method: 'GET',
        data: data
    }).then((res) => {
        handleMusic(res, type);
    })
    .catch(err => console.log(err));
}

function checkPool(mid) {
    var map = pool.findMusic(mid);
    if ( map ) {
        var { mid, name, pic, singer, url } = map;
        change(mid, name, pic, singer, url, 'repeat');
        return true;
    }
    return false;
}

function handleMusic(data, type) {
    var { mid, name, pic, singer, url } = data;
    pool.addMusic(data);
    change(mid, name, pic, singer, url, type);
}

// 请求歌手详情页数据并渲染
var singer_bg = document.querySelector('.singer-bg');
var page_singer_name = document.querySelector('.page-singer-name');
var songs_wrap = document.querySelector('.singer-songs-wrap ul');

function reqSingerData(singer_mid) {
    if ( singer_bg.getAttribute('singer_mid') == singer_mid ) { return };
    var data = {
        singer_mid: singer_mid
    }
    $.ajax({
        url: 'pino.json',
        method: 'GET',
        data: data
    }).then((res) => {
        handleSinger(res, singer_mid);
    }).catch((err) => {
        console.log(err);
    })
}

function handleSinger(res, singer_mid) {
    var [{ pic, singer, singer_mid }, lists] = res;
    singer_bg.setAttribute('singer_mid', singer_mid);
    singer_bg.style.cssText = `background-image:url(${pic})`;
    page_singer_name.textContent = singer;
    songs_wrap.innerHTML = '';
    var fragment = document.createDocumentFragment();
    for ( var list of lists ) {
        var { singer_name, song_mid, song_name } = list;
        var li = document.createElement('li');
        li.classList.add('singer-song');
        var html =
        `
        <div class="song-info" song_mid=${song_mid}>
            <p class="song-name">${song_name}</p>
            <p class="singer-name">${singer_name}</p>
        </div>
        <div class="ellipsis"><i></i></div>
        `
        li.innerHTML = html;
        fragment.appendChild(li);
    }
    songs_wrap.appendChild(fragment);
}

// 主页歌曲信息右侧立即播放与加入歌单
var selection = document.querySelector('.selection');
var play_now = selection.querySelector('.selection .play_now');
var add_list = selection.querySelector('.selection .add_list');

list_wrap.addEventListener('click',markMid);
play_now.addEventListener('click', playNow);
add_list.addEventListener('click', addToList);

function markMid(e) {
    if ( e.target.matches('.ellipsis, .ellipsis i') ) {
        var li = findParent(e.target, 'song');
        var mid = li.querySelector('.song-info').getAttribute('song_mid');
        var song_name = li.querySelector('.song-name').textContent;
        add_music.querySelector('.song-name').textContent = song_name;
        selection.setAttribute('song_mid', mid);
    }
}

function playNow() {
    var song_mid = this.parentNode.getAttribute('song_mid');
    reqMusicData(song_mid, 'lowerPlay');
    add_music.classList.remove('slide');
    grey.classList.remove('on');
}

function addToList() {
    var song_mid = this.parentNode.getAttribute('song_mid');
    reqMusicData(song_mid, 'onlyList');
    add_music.classList.remove('slide');
    grey.classList.remove('on');
}

// 歌手页歌曲信息点击播放、右侧立即播放与加入歌单
songs_wrap.addEventListener('click', pageMusic);
songs_wrap.addEventListener('click', slideUp);
songs_wrap.addEventListener('click', markPageMid);

function pageMusic(e) {
    if ( e.target.matches('.song-info, .song-info *') ) {
        var li = findParent(e.target, 'singer-song');
        var song_mid = li.querySelector('.song-info').getAttribute('song_mid');
        reqMusicData(song_mid);
    }
}

function slideUp(e) {
    if ( e.target.matches('.ellipsis i') ) {
        add_music.classList.add('slide');
        grey.classList.add('on');
    }
}

function markPageMid(e) {
    if ( e.target.matches('.ellipsis, .ellipsis i') ) {
        var li = findParent(e.target, 'singer-song');
        var mid = li.querySelector('.song-info').getAttribute('song_mid');
        var song_name = li.querySelector('.song-name').textContent;
        add_music.querySelector('.song-name').textContent = song_name;
        selection.setAttribute('song_mid', mid);
    }
}
blur.classList.add('show');
//saveMusicListToCache();
// Service Worker Register
if ( 'serviceWorker' in navigator ) {
    navigator.serviceWorker.register('./service_worker.js')
    .then( registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch( err => console.log('ServiceWorker registration failed: ', err));
}

// 一但歌单有变化就将其存储到cacheStorage
function saveMusicListToCache() {
    var cache_list = 'music_list';
    var musicList = pool.getMusicList();
    var data = JSON.stringify(musicList);
    if ( 'caches' in window ) {
        caches.open(cache_list)
        .then( cache => {
            cache.put(cache_list, new Response(data, { status: 200 }));
        })
    }
}

// 用户离开页面时将正在播放的mid存储到cache
player.addEventListener('loadedmetadata', () => {
    var last_playing_mid = 'last_playing_mid';
    var mid = player.getAttribute('mid');
    var data = JSON.stringify(mid);
    if ( 'caches' in window ) {
        caches.open(last_playing_mid)
        .then( cache => {
            cache.put(last_playing_mid, new Response(data, { status: 200 }));
        })
    }
})

// 每次页面启动时渲染用户之前离开时的musicList并显示离开时播放的歌曲
function getMusicListFromCache() {
    var cache_list = 'music_list';
    var last_playing_mid = 'last_playing_mid';
    if ( 'caches' in window ) {
        return Promise.all([
            caches.match(cache_list)
            .then( cache => {
                if ( !cache ) { return };
                return cache.json();
            }),
            caches.match(last_playing_mid)
            .then( cache => {
                if ( !cache ) { return };
                return cache.json();
            })
        ])
    } else {
        return Promise.resolve();
    }
}

getMusicListFromCache()
.then( response => {
    var [musicList, song_mid] = response;
    if ( !musicList || !song_mid ) {
        return;
    }
    self_wrap.innerHTML = '';
    pool.emptyMusicList();
    for ( var music of musicList ) {
        pool.addMusic(music);
        var { mid, name, pic, singer, url } = music;
        addToMusicList(mid, name, singer);
        if ( song_mid == mid ) {
            refresh(mid, name, pic, singer, url);
        }
    }
})
.catch( err => {
    console.log(err);
})

if ('usb' in navigator) {
    navigator.usb.addEventListener('connect', event => {
        // Add event.device to the UI.
        //stimulator._connect();
        //gen_waves(form, g_freq, g_amp, g_offset);
        console.log("usb connect");
    });
    
    navigator.usb.addEventListener('disconnect', event => {
        // Remove event.device from the UI.
        //alert('disconnect usb stimulator');
        warning.textContent = '设备已断开';
        warning.classList.add('on');
        setTimeout(() => { warning.classList.remove('on') }, 2000);
        console.log("disconnect");
    });    
}