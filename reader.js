// 朗读器 - Web Speech API
(function() {
    var synth = window.speechSynthesis;
    var utterance = null;
    var btn;
    var STORAGE_KEY = "shushi_voice";
    var DEFAULT_VOICE = "Microsoft Kangkang - Chinese (Simplified, PRC)";
    var SPEED = 1.2;  // 120%

    // ===== 获取本地中文语音列表 =====
    function getLocalChineseVoices() {
        var result = [];
        var voices = synth.getVoices();
        for (var v of voices) {
            if ((v.lang || "").startsWith("zh") && v.localService) result.push(v);
        }
        return result;
    }

    // ===== 按名字找语音 =====
    function findVoiceByName(name) {
        var voices = synth.getVoices();
        for (var v of voices) {
            if (v.name === name) return v;
        }
        return null;
    }

    // ===== 获取保存的语音名 =====
    function getSavedVoiceName() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_VOICE;
    }

    // ===== 获取当前音色名 =====
    window.getReaderVoiceName = function() {
        return getSavedVoiceName();
    };

    // ===== 保存语音名 =====
    function saveVoiceName(name) {
        try { localStorage.setItem(STORAGE_KEY, name); } catch(e) {}
    }

    // ===== 获取要用的语音对象 =====
    function getVoice() {
        var saved = getSavedVoiceName();
        var v = findVoiceByName(saved);
        if (v) return v;
        var local = getLocalChineseVoices();
        return local.length > 0 ? local[0] : null;
    }

    // ===== 循环切换音色（首页用） =====
    window.cycleReaderVoice = function(direction) {
        var local = getLocalChineseVoices();
        if (local.length === 0) return null;
        var current = getSavedVoiceName();
        var idx = -1;
        for (var i = 0; i < local.length; i++) {
            if (local[i].name === current) { idx = i; break; }
        }
        if (idx === -1) idx = 0;
        var newIdx = (idx + direction + local.length) % local.length;
        var newVoice = local[newIdx];
        saveVoiceName(newVoice.name);
        return newVoice;
    };

    // ===== 朗读指定文字（首页用） =====
    window.speakText = function(text, callback) {
        if (!text) return;
        synth.cancel();
        var utter = new SpeechSynthesisUtterance(text);
        utter.lang = "zh-CN";
        utter.rate = SPEED;
        var voice = getVoice();
        if (voice) utter.voice = voice;
        if (callback) utter.onend = callback;
        synth.speak(utter);
    };

    // ===== 章节页朗读正文 =====
    function getContentText() {
        var content = document.querySelector(".content");
        if (!content) return "";
        var ps = content.querySelectorAll("p");
        var parts = [];
        for (var i = 0; i < ps.length; i++) {
            var txt = ps[i].textContent.trim();
            if (i === 0 && /^第\d+节/.test(txt)) continue;
            if (txt.length < 2) continue;
            if (/^[\d\-—\s]+$/.test(txt)) continue;
            parts.push(txt);
        }
        return parts.join("。");
    }

    function speak() {
        if (synth.speaking && !synth.paused) {
            synth.cancel();
            btn.textContent = "\uD83D\uDD0A 朗读本文";
            return;
        }
        var text = getContentText();
        if (!text) { btn.textContent = "\uD83D\uDD07 无可读内容"; return; }
        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = SPEED;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        var voice = getVoice();
        if (voice) utterance.voice = voice;
        utterance.onstart = function() { btn.textContent = "\u23F8 暂停"; };
        utterance.onend = function() { btn.textContent = "\uD83D\uDD0A 朗读本文"; };
        utterance.onerror = function() { btn.textContent = "\uD83D\uDD0A 朗读本文"; };
        utterance.onpause = function() { btn.textContent = "\u25B6 继续朗读"; };
        utterance.onresume = function() { btn.textContent = "\u23F8 暂停"; };
        synth.speak(utterance);
        btn.textContent = "\u23F8 暂停";
    }

    // ===== 初始化章节页按钮 =====
    function init() {
        var content = document.querySelector(".content");
        if (!content) return;
        var firstP = content.querySelector("p");
        if (!firstP) return;
        btn = document.createElement("button");
        btn.textContent = "\uD83D\uDD0A 朗读本文";
        btn.style.cssText = "background:#d4a843;color:#0a0a12;border:none;padding:4px 14px;font-size:14px;border-radius:4px;cursor:pointer;font-family:inherit;vertical-align:middle;margin-left:12px";
        btn.onclick = speak;
        firstP.appendChild(btn);
        synth.getVoices();
        if (synth.onvoiceschanged !== undefined) synth.getVoices();
    }

    // ===== 预加载语音列表 =====
    var preloaded = false;
    function ensureVoices() {
        if (preloaded) return;
        var v = synth.getVoices();
        if (v.length > 0) preloaded = true;
    }
    ensureVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = function() { preloaded = true; synth.getVoices(); };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
