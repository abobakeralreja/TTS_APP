let authHeader = "";
let lastWord = "";
let autoSpeakEnabled = false;

// ✅ VOICE SPEED (NEU)
let voiceSpeed = 1.0;

// 🔑 HuggingFace Token
const HF_TOKEN = "your_hf_token_here";

// KI-Autokorrektur
let autoCorrectMode = "off"; // "off" | "word" | "sentence"
let webllmModule = null;
let llmEngine = null;
let llmLoading = false;

/* ===================== LOGIN ===================== */

function login() {
    const user = document.getElementById("username").value;
    const pw = document.getElementById("password").value;
    const errorEl = document.getElementById("login-error");

    errorEl.innerText = "";

    if (!user || !pw) {
        errorEl.innerText = "Please enter username and password.";
        return;
    }

    authHeader = "Basic " + btoa(user + ":" + pw);

    fetch("/history", {
        method: "GET",
        headers: { Authorization: authHeader }
    }).then(res => {
        if (res.status === 200) {
            document.getElementById("login-box").style.display = "none";
            document.getElementById("app").style.display = "block";
        } else {
            errorEl.innerText = "Login failed";
        }
    });
}

/* ===================== LOGOUT (WIEDER DA) ===================== */

function logout() {
    authHeader = "";
    document.getElementById("app").style.display = "none";
    document.getElementById("login-box").style.display = "block";
    document.getElementById("password").value = "";

    // Modals schließen (wie früher)
    const ids = ["settings-modal", "favorites-modal", "categories-modal", "history-modal"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    // Categories-Ansicht zurücksetzen
    const phrasesView = document.getElementById("phrases-view");
    const categoriesView = document.getElementById("categories-view");
    if (phrasesView) phrasesView.classList.add("hidden");
    if (categoriesView) categoriesView.classList.remove("hidden");
}

/* ===================== SETTINGS ===================== */

function openSettingsModal() {
    document.getElementById("settings-modal").classList.remove("hidden");
}
function closeSettingsModal() {
    document.getElementById("settings-modal").classList.add("hidden");
}

/* ===================== KI (NUR FÜR SÄTZE) ===================== */

async function initLLM() {
    if (llmEngine || llmLoading) return;
    llmLoading = true;

    try {
        if (!webllmModule) {
            webllmModule = await import("https://esm.run/@mlc-ai/web-llm");
        }

        const { CreateMLCEngine, prebuiltAppConfig } = webllmModule;
        const modelId = prebuiltAppConfig.model_list[0].model_id;

        llmEngine = await CreateMLCEngine(modelId, {
            appConfig: prebuiltAppConfig,
            hf_token: HF_TOKEN
        });
    } catch (e) {
        console.error("LLM error", e);
    } finally {
        llmLoading = false;
    }
}

async function aiCorrectSentence(text) {
    try {
        if (!llmEngine) await initLLM();
        if (!llmEngine) return text;

        const reply = await llmEngine.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are an English spelling and grammar corrector. " +
                        "Return ONLY the corrected sentence."
                },
                { role: "user", content: text }
            ],
            temperature: 0
        });

        return reply.choices[0].message.content.trim();
    } catch {
        return text;
    }
}

/* ===================== WORT-AUTOKORREKTUR (SMART & STABIL) ===================== */

// ❗ KEINE KI HIER – NUR REGELN
const WORD_FIXES = {
    "wnt": "want",
    "wont": "want",
    "tu": "to",
    "gu": "go",
    "teh": "the",
    "scholl": "school",
    "scool": "school",
    "becaus": "because",
    "hav": "have"
};

function correctSingleWord(word) {
    const lower = word.toLowerCase();
    if (WORD_FIXES[lower]) {
        return WORD_FIXES[lower];
    }
    return word;
}

/* ===================== EVENTS ===================== */

document.addEventListener("DOMContentLoaded", () => {

    // ✅ Voice speed UI (NEU, aber ohne andere Logik zu ändern)
    const speedMain = document.getElementById("voice-speed");
    const speedMainVal = document.getElementById("voice-speed-value");

    const speedSettings = document.getElementById("voice-speed-settings");
    const speedSettingsVal = document.getElementById("voice-speed-settings-value");

    const mainPlayer = document.getElementById("audio-player");

    function applySpeed(v) {
        voiceSpeed = parseFloat(v) || 1.0;
        if (speedMainVal) speedMainVal.innerText = voiceSpeed.toFixed(2);
        if (speedSettingsVal) speedSettingsVal.innerText = voiceSpeed.toFixed(2);
        if (mainPlayer) mainPlayer.playbackRate = voiceSpeed;

        // Slider sync
        if (speedMain && speedMain.value !== String(voiceSpeed)) speedMain.value = String(voiceSpeed);
        if (speedSettings && speedSettings.value !== String(voiceSpeed)) speedSettings.value = String(voiceSpeed);
    }

    if (speedMain) {
        applySpeed(speedMain.value);
        speedMain.addEventListener("input", () => applySpeed(speedMain.value));
    }
    if (speedSettings) {
        applySpeed(speedSettings.value);
        speedSettings.addEventListener("input", () => applySpeed(speedSettings.value));
    }

    // --- dein bestehender Code bleibt gleich ab hier ---
    const speakRadios = document.getElementsByName("speak-mode");
    speakRadios.forEach(r => {
        if (r.checked) autoSpeakEnabled = r.value === "word";
        r.addEventListener("change", () => {
            autoSpeakEnabled = r.value === "word";
            lastWord = "";
        });
    });

    const acRadios = document.getElementsByName("autocorrect-mode");
    acRadios.forEach(r => {
        if (r.checked) autoCorrectMode = r.value;
        r.addEventListener("change", () => {
            autoCorrectMode = r.value;
        });
    });

    const textarea = document.getElementById("tts-text");

    textarea.addEventListener("input", () => {
        if (!textarea.value.endsWith(" ")) return;

        const words = textarea.value.trim().split(/\s+/);
        const currentWord = words[words.length - 1];
        if (!currentWord || currentWord === lastWord) return;
        lastWord = currentWord;

        // 🔹 Wort-Autokorrektur
        let spokenWord = currentWord;

        if (autoCorrectMode === "word") {
            const fixed = correctSingleWord(currentWord);
            if (fixed !== currentWord) {
                words[words.length - 1] = fixed;
                textarea.value = words.join(" ") + " ";
                spokenWord = fixed;
            }
        }

        // 🔊 Wort sprechen
        if (autoSpeakEnabled) {
            speakSingleWord(spokenWord);
        }
    });
});

/* ===================== TTS ===================== */

async function sendTTS() {
    const textarea = document.getElementById("tts-text");
    let text = textarea.value;
    const statusEl = document.getElementById("tts-status");

    if (!text.trim()) return;

    // ✅ NUR HIER KI
    if (autoCorrectMode === "sentence") {
        text = await aiCorrectSentence(text);
        textarea.value = text;
    }

    statusEl.innerText = "Sending...";

    fetch("/tts/speak", {
        method: "POST",
        headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                const player = document.getElementById("audio-player");
                player.src = "/audio/" + data.file;

                // ✅ Speed auf den Hauptplayer anwenden
                player.playbackRate = voiceSpeed;
                player.play();

                statusEl.innerText = "Audio ready.";
            }
        });
}

function speakSingleWord(word) {
    fetch("/tts/speak", {
        method: "POST",
        headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: word })
    }).then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                const a = new Audio("/audio/" + data.file);

                // ✅ Speed auf Wort-Audio anwenden
                a.playbackRate = voiceSpeed;

                a.play();
            }
        });
}

/* =========================================================
   ✅ AB HIER: FAVORITES / CATEGORIES / HISTORY (WIEDER DA)
   ========================================================= */

/* ===================== FAVORITES ===================== */

let favoriteSentences = [
    "Hello, how are you?",
    "Excuse me, can you help me?",
    "I can't speak. Please read this message.",
    "Thank you very much.",
    "Where is the bathroom?"
];

function openFavoritesModal() {
    document.getElementById("favorites-modal").classList.remove("hidden");
    renderFavoritesList();
}

function closeFavoritesModal() {
    document.getElementById("favorites-modal").classList.add("hidden");
}

function renderFavoritesList() {
    const list = document.getElementById("favorites-list");
    list.innerHTML = "";

    favoriteSentences.forEach((sentence, index) => {
        const row = document.createElement("div");
        row.className = "favorite-row";

        const textDiv = document.createElement("div");
        textDiv.className = "favorite-text";
        textDiv.textContent = sentence;
        textDiv.style.cursor = "pointer";
        textDiv.addEventListener("click", () => useFavorite(sentence));

        const actions = document.createElement("div");
        actions.className = "favorite-actions";

        const delBtn = document.createElement("button");
        delBtn.className = "favorite-delete-btn";
        delBtn.textContent = "🗑️";
        delBtn.addEventListener("click", () => deleteFavorite(index));

        actions.appendChild(delBtn);

        row.appendChild(textDiv);
        row.appendChild(actions);

        list.appendChild(row);
    });
}

function useFavorite(text) {
    document.getElementById("tts-text").value = text;
    sendTTS();
}

function addFavorite() {
    const input = document.getElementById("new-fav-input");
    const value = (input.value || "").trim();
    if (!value) return;

    favoriteSentences.push(value);
    input.value = "";
    renderFavoritesList();
}

function deleteFavorite(index) {
    favoriteSentences.splice(index, 1);
    renderFavoritesList();
}

/* ===================== CATEGORIES ===================== */

const categories = [
    { id: "cafe", icon: "☕", title: "Café" },
    { id: "supermarket", icon: "🛒", title: "Supermarket" },
    { id: "doctor", icon: "🏥", title: "Doctor" },
    { id: "school", icon: "🏫", title: "School" },
    { id: "shopping", icon: "🛍️", title: "Shopping" },
    { id: "feelings", icon: "😀", title: "Feelings" }
];

function openCategoriesModal() {
    document.getElementById("categories-modal").classList.remove("hidden");
    renderCategoryList();
}

function closeCategoriesModal() {
    document.getElementById("categories-modal").classList.add("hidden");
    document.getElementById("phrases-view").classList.add("hidden");
    document.getElementById("categories-view").classList.remove("hidden");
}

function renderCategoryList() {
    const box = document.getElementById("categories-view");
    const phrasesView = document.getElementById("phrases-view");

    box.innerHTML = "";
    phrasesView.classList.add("hidden");
    box.classList.remove("hidden");

    categories.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.innerHTML = `
            <div class="category-card-icon">${cat.icon}</div>
            <div class="category-card-title">${cat.title}</div>
        `;
        card.addEventListener("click", () => openCategory(cat));
        box.appendChild(card);
    });
}

function openCategory(cat) {
    const phrasesBox = document.getElementById("phrases-list");
    const title = document.getElementById("phrases-title");

    document.getElementById("categories-view").classList.add("hidden");
    document.getElementById("phrases-view").classList.remove("hidden");

    title.innerText = cat.title;

    const data = {
        cafe: [
            "Can I have a coffee, please?",
            "I would like a cappuccino.",
            "Can I get a tea?",
            "I would like some water, please.",
            "Can I have something to eat?"
        ],
        supermarket: [
            "Where can I find the bread?",
            "Do you have fresh fruits?",
            "Where is the cashier?",
            "I need help finding something."
        ],
        doctor: [
            "I am not feeling well.",
            "I have pain.",
            "I need medical help.",
            "Can I get an appointment?"
        ],
        school: [
            "I need help with this task.",
            "Can you repeat that, please?",
            "I didn't understand.",
            "Where is the classroom?"
        ],
        shopping: [
            "How much does this cost?",
            "Do you have this in a different size?",
            "Do you have this in another color?",
            "Where can I pay?"
        ],
        feelings: [
            "I feel good.",
            "I feel bad.",
            "I am scared.",
            "I am in pain.",
            "I need help."
        ]
    };

    const phrases = data[cat.id] || [];
    phrasesBox.innerHTML = "";

    phrases.forEach(text => {
        const btn = document.createElement("button");
        btn.className = "phrase-btn";
        btn.innerText = text;
        btn.addEventListener("click", () => {
            document.getElementById("tts-text").value = text;
            sendTTS();
        });
        phrasesBox.appendChild(btn);
    });
}

/* ===================== HISTORY ===================== */

function openHistoryModal() {
    document.getElementById("history-modal").classList.remove("hidden");
    loadHistoryModal();
}

function closeHistoryModal() {
    document.getElementById("history-modal").classList.add("hidden");
}

function loadHistoryModal() {
    fetch("/history", {
        method: "GET",
        headers: { Authorization: authHeader }
    })
        .then(res => res.json())
        .then(list => {
            const box = document.getElementById("history-list");
            box.innerHTML = "";

            if (!Array.isArray(list) || list.length === 0) {
                box.innerHTML = "<p>No entries yet.</p>";
                return;
            }

            list.forEach(item => {
                const div = document.createElement("div");
                div.className = "history-item";

                div.innerHTML = `
                <div class="history-header-row">
                    <div class="history-text">${item.text}</div>
                    <button class="history-delete-btn">Delete</button>
                </div>
                <audio controls src="/audio/${item.file}"></audio>
                <div class="history-time">${item.timestamp}</div>
            `;

                const delBtn = div.querySelector(".history-delete-btn");
                delBtn.addEventListener("click", () => deleteHistoryItem(item.file));

                box.appendChild(div);
            });
        })
        .catch(() => {
            const box = document.getElementById("history-list");
            box.innerHTML = "<p>Could not load history.</p>";
        });
}

function deleteHistoryItem(fileName) {
    fetch(`/history/${fileName}`, {
        method: "DELETE",
        headers: { Authorization: authHeader }
    })
        .then(() => loadHistoryModal());
}

function deleteAllHistory() {
    if (!confirm("Delete all history entries?")) return;

    fetch("/history/all", {
        method: "DELETE",
        headers: { Authorization: authHeader }
    })
        .then(() => loadHistoryModal());
}