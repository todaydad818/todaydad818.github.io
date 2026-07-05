// 朗读器 - Web Speech API
(function() {
    var synth = window.speechSynthesis;
    var utterance = null;
    var btn;
    var VOICE_KEY = "shushi_voice";
    var SPEED_KEY = "shushi_speed";
    var DEFAULT_VOICE = "Microsoft Kangkang - Chinese (Simplified, PRC)";
    var DEFAULT_SPEED = 1.2;

    // ===== 速度读写 =====
    function getSpeed() {
        var v = parseFloat(localStorage.getItem(SPEED_KEY));
        return isNaN(v) ? DEFAULT_SPEED : Math.max(0.3, Math.min(3.0, v));
    }
    function saveSpeed(val) {
        try { localStorage.setItem(SPEED_KEY, String(val)); } catch(e) {}
    }

    window.getReaderSpeed = function() {
        return Math.round(getSpeed() * 100) + "%";
    };

    window.cycleReaderSpeed = function(dir) {
        var cur = getSpeed();
        var step = 0.1;
        var newSpeed = Math.round((cur + dir * step) * 10) / 10;
        newSpeed = Math.max(0.3, Math.min(3.0, newSpeed));
        saveSpeed(newSpeed);
        return newSpeed;
    };

    // ===== 语音读写 =====
    function getLocalChineseVoices() {
        var result = [];
        var voices = synth.getVoices();
        for (var v of voices) {
            if ((v.lang || "").startsWith("zh") && v.localService) result.push(v);
        }
        return result;
    }
    function findVoiceByName(name) {
        var voices = synth.getVoices();
        for (var v of voices) { if (v.name === name) return v; }
        return null;
    }
    function getSavedVoiceName() {
        return localStorage.getItem(VOICE_KEY) || DEFAULT_VOICE;
    }
    window.getReaderVoiceName = function() { return getSavedVoiceName(); };
    function saveVoiceName(name) { try { localStorage.setItem(VOICE_KEY, name); } catch(e) {} }

    function getVoice() {
        var saved = getSavedVoiceName();
        var v = findVoiceByName(saved);
        if (v) return v;
        var local = getLocalChineseVoices();
        return local.length > 0 ? local[0] : null;
    }

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

    // ===== 朗读 =====
    window.speakText = function(text, callback) {
        if (!text) return;
        synth.cancel();
        var utter = new SpeechSynthesisUtterance(text);
        utter.lang = "zh-CN";
        utter.rate = getSpeed();
        var voice = getVoice();
        if (voice) utter.voice = voice;
        if (callback) utter.onend = callback;
        synth.speak(utter);
    };

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
        utterance.rate = getSpeed();
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
