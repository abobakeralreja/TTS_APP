// Supabase Setup
const SUPABASE_URL = "https://vgfrfqoyooyqrhyuandj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZnJmcW95b295cXJoeXVhbmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Njg2MjYsImV4cCI6MjA4NzU0NDYyNn0.czLe8NIXgXBkhWE6ojHYzNP85VuDrNrhQHh-cmS63VA";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
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

async function login() {
    const email = document.getElementById("username").value;
    const pw = document.getElementById("password").value;
    const errorEl = document.getElementById("login-error");
    const infoEl = document.getElementById("auth-status");

    errorEl.innerText = "";
    infoEl.innerText = "Signing in...";

    if (!email || !pw) {
        infoEl.innerText = "";
        errorEl.innerText = "Please enter email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: pw,
    });

    if (error) {
        infoEl.innerText = "";
        errorEl.innerText = "Login failed: " + error.message;
    } else {
        infoEl.innerText = "";
        currentUser = data.user;
        document.getElementById("login-box").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("password").value = "";
    }
}

async function register() {
    const email = document.getElementById("username").value;
    const pw = document.getElementById("password").value;
    const errorEl = document.getElementById("login-error");
    const infoEl = document.getElementById("auth-status");

    errorEl.innerText = "";
    infoEl.innerText = "Registering...";

    if (!email || !pw) {
        infoEl.innerText = "";
        errorEl.innerText = "Please enter email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: pw,
    });

    if (error) {
        infoEl.innerText = "";
        errorEl.innerText = "Registration failed: " + error.message;
    } else {
        infoEl.innerText = "Registration successful! You can now sign in.";
        document.getElementById("password").value = "";
    }
}

/* ===================== LOGOUT (WIEDER DA) ===================== */

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
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

async function aiCorrectSentence(text) {
    try {
        const res = await fetch("https://api.languagetool.org/v2/check", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                text: text,
                language: "en-US"
            })
        });
        
        const data = await res.json();
        if (!data.matches || data.matches.length === 0) return text;

        let corrected = text;
        const matches = data.matches.sort((a, b) => b.offset - a.offset);
        
        for (const match of matches) {
            if (match.replacements && match.replacements.length > 0) {
                const original = text.substr(match.offset, match.length);
                let repl = match.replacements[0].value;
                
                const oneWordRepl = match.replacements.find(r => !r.value.includes(' '));
                if (original.indexOf(' ') === -1 && oneWordRepl) {
                    repl = oneWordRepl.value;
                }
                
                corrected = corrected.substring(0, match.offset) + repl + corrected.substring(match.offset + match.length);
            }
        }
        
        if (corrected.length > 0 && corrected.charAt(0) !== corrected.charAt(0).toUpperCase()) {
            corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
        }
        return corrected;
    } catch (e) {
        console.error("Autocorrect Error:", e);
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

document.addEventListener("DOMContentLoaded", async () => {

    // Check active session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        document.getElementById("login-box").style.display = "none";
        document.getElementById("app").style.display = "block";
    }

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

    fetch("/api/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    })
        .then(async res => {
            if (!res.ok) {
                statusEl.innerText = "Error generating audio.";
                return;
            }

            // Expected direct audio stream
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);

            const player = document.getElementById("audio-player");
            player.src = audioUrl;

            // ✅ Speed auf den Hauptplayer anwenden
            player.playbackRate = voiceSpeed;
            player.play();

            statusEl.innerText = "Audio ready.";

            // Handle Supabase uploading to keep history records working.
            // Since this is dynamically generated by Google, we first upload the Blob to Supabase Storage.
            if (currentUser) {
                const fileName = `tts_${Date.now()}.mp3`;
                const { data, error } = await supabaseClient.storage.from('audio').upload(fileName, blob, {
                    contentType: 'audio/mpeg'
                });

                if (!error) {
                    const { data: publicUrlData } = supabaseClient.storage.from('audio').getPublicUrl(fileName);
                    await supabaseClient.from('history').insert([
                        { user_id: currentUser.id, text: text, file: publicUrlData.publicUrl }
                    ]);
                }
            }
        });
}

function speakSingleWord(word) {
    fetch("/api/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: word })
    })
        .then(async res => {
            if (!res.ok) return;

            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);

            const a = new Audio(audioUrl);

            // ✅ Speed auf Wort-Audio anwenden
            a.playbackRate = voiceSpeed;

            a.play();
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

async function loadHistoryModal() {
    const box = document.getElementById("history-list");
    box.innerHTML = "Loading...";

    const { data: list, error } = await supabase
        .from('history')
        .select('*')
        .order('timestamp', { ascending: false });

    box.innerHTML = "";

    if (error || !list || list.length === 0) {
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
        <audio controls src="${item.file}"></audio>
        <div class="history-time">${new Date(item.timestamp).toLocaleString()}</div>
    `;

        const delBtn = div.querySelector(".history-delete-btn");
        delBtn.addEventListener("click", () => deleteHistoryItem(item.id, item.file));

        box.appendChild(div);
    });
}

async function deleteHistoryItem(id, fileUrl) {
    if (fileUrl && fileUrl.includes('supabase.co')) {
        const fileName = fileUrl.split('/').pop();
        await supabaseClient.storage.from('audio').remove([fileName]);
    }

    await supabaseClient.from('history').delete().eq('id', id);
    loadHistoryModal();
}

async function deleteAllHistory() {
    if (!confirm("Delete all history entries?")) return;

    if (currentUser) {
        await supabaseClient.from('history').delete().eq('user_id', currentUser.id);
        loadHistoryModal();
    }
}

/* ===================== FEEDBACK SYSTEM ===================== */

let currentRating = 0;

function openFeedbackModal() {
    document.getElementById("feedback-modal").classList.remove("hidden");

    // Reset form
    currentRating = 0;
    document.getElementById("feedback-comment").value = "";
    document.getElementById("feedback-status").innerText = "";

    // Reset stars UI
    const stars = document.querySelectorAll("#star-rating .star");
    stars.forEach(s => s.classList.remove("selected"));
}

function closeFeedbackModal() {
    document.getElementById("feedback-modal").classList.add("hidden");
}

// Star rating click handler setup
document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll("#star-rating .star");
    stars.forEach(star => {
        star.addEventListener("click", (e) => {
            currentRating = parseInt(e.target.getAttribute("data-value"));

            // Highlight stars up to the selected one
            stars.forEach(s => {
                if (parseInt(s.getAttribute("data-value")) <= currentRating) {
                    s.classList.add("selected");
                    s.style.color = "gold";
                } else {
                    s.classList.remove("selected");
                    s.style.color = "var(--glass-border)";
                }
            });
        });
    });
});

async function submitFeedback() {
    const statusEl = document.getElementById("feedback-status");
    const comment = document.getElementById("feedback-comment").value.trim();

    if (currentRating === 0) {
        statusEl.innerText = "Please select a star rating.";
        statusEl.style.color = "var(--error)";
        return;
    }

    if (!currentUser) {
        statusEl.innerText = "You must be logged in to leave feedback.";
        statusEl.style.color = "var(--error)";
        return;
    }

    statusEl.innerText = "Submitting...";
    statusEl.style.color = "var(--text-main)";

    const { error } = await supabaseClient.from('feedback').insert([
        { user_id: currentUser.id, rating: currentRating, comment: comment }
    ]);

    if (error) {
        statusEl.innerText = "Failed to submit feedback. Please try again.";
        statusEl.style.color = "var(--error)";
        console.error(error);
    } else {
        statusEl.innerText = "Thank you for your feedback!";
        statusEl.style.color = "var(--accent)";

        // Auto close after 2 seconds
        setTimeout(() => {
            closeFeedbackModal();
        }, 2000);
    }
}