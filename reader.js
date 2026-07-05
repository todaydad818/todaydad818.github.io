// 朗读器 - Web Speech API (本地语音版)
(function() {
    var synth = window.speechSynthesis;
    var utterance = null;
    var btn;

    function getLocalChineseVoice(voices) {
        // 只选本地中文语音，不依赖网络
        var local = [];
        for (var v of voices) {
            if ((v.lang || "").startsWith("zh") && v.localService) local.push(v);
        }
        if (local.length === 0) return null;

        // 偏好年轻女声
        var preferred = ["Xiaoxiao", "Xiaohan", "Xiaoyi", "Xiaomeng", "Tingting", "Huihui", "Zhiyu", "Yaoyao", "Mei-Jia"];
        for (var p of preferred) {
            for (var v of local) {
                if (v.name.indexOf(p) >= 0) return v;
            }
        }
        // 其次：名字含 Female/女 的
        for (var v of local) {
            if (v.name.indexOf("Female") >= 0 || v.name.indexOf("女") >= 0) return v;
        }
        // 兜底：第一个本地中文
        return local[0];
    }

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
            btn.textContent = "🔊 朗读本文";
            return;
        }

        var text = getContentText();
        if (!text) { btn.textContent = "🔇 无可读内容"; return; }

        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        var voice = getLocalChineseVoice(synth.getVoices());
        if (voice) utterance.voice = voice;

        utterance.onstart = function() { btn.textContent = "⏸ 暂停"; };
        utterance.onend = function() { btn.textContent = "🔊 朗读本文"; };
        utterance.onerror = function() { btn.textContent = "🔊 朗读本文"; };
        utterance.onpause = function() { btn.textContent = "▶ 继续朗读"; };
        utterance.onresume = function() { btn.textContent = "⏸ 暂停"; };

        synth.speak(utterance);
        btn.textContent = "⏸ 暂停";
    }

    function init() {
        var content = document.querySelector(".content");
        if (!content) return;
        var firstP = content.querySelector("p");
        if (!firstP) return;

        btn = document.createElement("button");
        btn.textContent = "🔊 朗读本文";
        btn.style.cssText = "background:#d4a843;color:#0a0a12;border:none;padding:4px 14px;font-size:14px;border-radius:4px;cursor:pointer;font-family:inherit;vertical-align:middle;margin-left:12px";
        btn.onclick = speak;
        firstP.appendChild(btn);

        synth.getVoices();
        if (synth.onvoiceschanged !== undefined) synth.getVoices();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
