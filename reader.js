// 朗读器 - 使用 Web Speech API
(function() {
    var synth = window.speechSynthesis;
    var utterance = null;
    var isPlaying = false;
    var btn, statusEl;

    function getChineseVoice() {
        var voices = synth.getVoices();
        // 优先：中文女声
        for (var v of voices) {
            var lang = v.lang || "";
            if (lang.startsWith("zh") || lang.startsWith("cmn")) {
                if (lang.indexOf("CN") >= 0 || lang.indexOf("HKG") >= 0 || lang.indexOf("TWN") >= 0) {
                    return v;
                }
            }
        }
        // 其次：任何中文
        for (var v of voices) {
            var lang = v.lang || "";
            if (lang.startsWith("zh") || lang.startsWith("cmn")) return v;
        }
        return null;
    }

    function getContentText() {
        var content = document.querySelector(".content");
        if (!content) return "";
        // 提取纯文本，去掉标题行和分隔符
        var text = content.innerText || content.textContent || "";
        // 移除章节标题（第一行）
        var lines = text.split("\n").filter(function(l) { return l.trim(); });
        // 过滤掉纯数字、纯分隔符的行
        lines = lines.filter(function(l) {
            return l.trim() !== "—" && l.trim() !== "-" && l.length > 2;
        });
        return lines.join("。");
    }

    function speak() {
        if (synth.speaking && !synth.paused) {
            synth.cancel();
        }

        var text = getContentText();
        if (!text) {
            setStatus("无可读内容");
            return;
        }

        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 1.0;     // 语速
        utterance.pitch = 1.0;    // 音调
        utterance.volume = 1.0;

        var voice = getChineseVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = function() { isPlaying = true; setStatus("朗读中… 点击暂停"); };
        utterance.onend = function() { isPlaying = false; setStatus("朗读完毕"); };
        utterance.onerror = function() { isPlaying = false; setStatus("朗读出错"); };
        utterance.onpause = function() { isPlaying = false; setStatus("已暂停"); };
        utterance.onresume = function() { isPlaying = true; setStatus("朗读中… 点击暂停"); };

        synth.speak(utterance);
        isPlaying = true;
        setStatus("朗读中… 点击暂停");
    }

    function toggle() {
        if (synth.speaking && !synth.paused) {
            synth.pause();
        } else if (synth.paused) {
            synth.resume();
        } else {
            speak();
        }
    }

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    function init() {
        // 创建UI
        var container = document.querySelector(".container");
        if (!container) return;

        var div = document.createElement("div");
        div.style.cssText = "text-align:center;padding:10px 0;margin-bottom:5px";

        btn = document.createElement("button");
        btn.textContent = "🔊 朗读本文";
        btn.style.cssText = "background:#d4a843;color:#0a0a12;border:none;padding:8px 20px;font-size:15px;border-radius:4px;cursor:pointer;font-family:inherit";
        btn.onclick = toggle;

        statusEl = document.createElement("span");
        statusEl.style.cssText = "margin-left:12px;font-size:13px;color:#a09080";

        div.appendChild(btn);
        div.appendChild(statusEl);

        // 插入到章节导航上方
        var nav = document.getElementById("chapter-nav");
        if (nav) {
            container.insertBefore(div, nav);
        } else {
            container.appendChild(div);
        }

        // Chrome 需要先触发 getVoices
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = function() {};
        }
        // 预加载语音列表
        synth.getVoices();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
