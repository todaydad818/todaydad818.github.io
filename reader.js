// 朗读器 - Web Speech API
(function() {
    var synth = window.speechSynthesis;
    var utterance = null;
    var isPlaying = false;
    var btn;

    function getPreferredVoice(voices) {
        // 优先名单：年轻女声
        var preferred = ["Xiaoxiao", "Xiaohan", "Xiaoyi", "Xiaomeng", "Yunjian", "Tingting", "Mei-Jia", "Huihui", "Zhiyu", "Yaoyao"];
        // 先找中文女声里的优先名单
        for (var p of preferred) {
            for (var v of voices) {
                if ((v.lang || "").startsWith("zh") && v.name.indexOf(p) >= 0) return v;
            }
        }
        // 其次：任何中文女声
        for (var v of voices) {
            if ((v.lang || "").startsWith("zh") && (v.name.indexOf("Female") >= 0 || v.name.indexOf("女") >= 0)) return v;
        }
        // 再次：任何中文
        for (var v of voices) {
            if ((v.lang || "").startsWith("zh")) return v;
        }
        return null;
    }

    function getContentText() {
        var content = document.querySelector(".content");
        if (!content) return "";
        // 跳过标题行，从正文开始
        var ps = content.querySelectorAll("p");
        var parts = [];
        for (var i = 0; i < ps.length; i++) {
            var txt = ps[i].textContent.trim();
            // 跳过标题行（如 "第01节 卑微的阿金"）
            if (i === 0 && /^第\d+节/.test(txt)) continue;
            // 跳过纯数字/纯短行
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

        var voice = getPreferredVoice(synth.getVoices());
        if (voice) utterance.voice = voice;

        utterance.onstart = function() { isPlaying = true; btn.textContent = "⏸ 暂停"; };
        utterance.onend = function() { isPlaying = false; btn.textContent = "🔊 朗读本文"; };
        utterance.onerror = function() { isPlaying = false; btn.textContent = "🔊 朗读本文"; };
        utterance.onpause = function() { isPlaying = false; btn.textContent = "▶ 继续朗读"; };
        utterance.onresume = function() { isPlaying = true; btn.textContent = "⏸ 暂停"; };

        synth.speak(utterance);
        isPlaying = true;
        btn.textContent = "⏸ 暂停";
    }

    function init() {
        var content = document.querySelector(".content");
        if (!content) return;

        // 找到标题行（第一个 <p>）
        var firstP = content.querySelector("p");
        if (!firstP) return;

        // 创建按钮，跟在标题后面
        btn = document.createElement("button");
        btn.textContent = "🔊 朗读本文";
        btn.style.cssText = "background:#d4a843;color:#0a0a12;border:none;padding:4px 14px;font-size:14px;border-radius:4px;cursor:pointer;font-family:inherit;vertical-align:middle;margin-left:12px";

        btn.onclick = speak;

        // 插入到标题文字后面
        firstP.appendChild(btn);

        // 预加载语音列表
        synth.getVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.getVoices(); // Chrome 需要二次触发
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
