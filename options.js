import { configuration } from '/modules.js';

const providers = {
    "openai": "OpenAI",
    "google": "Google",
    "groq": "Groq"
};

const models = {
    "openai": [        
        "gpt-3.5-turbo",
        "gpt-4-turbo",        
        "gpt-4o",
        "gpt-4"
    ],
    "google": [
        //"gemini-1.5-flash",
        "gemini-1.5-pro-latest",
        "gemini-pro",
    ],
    "groq": [
        "mixtral-8x7b-32768",
        "llama3-8b-8192",
        "llama3-70b-8192",
        "gemma-7b-it",
        "gemma2-9b-it"
    ]
};

const apiUrls = {
    "openai": "https://api.openai.com",
    "google": "https://generativelanguage.googleapis.com",
    "groq": "https://api.groq.com"
};

const languages = {
    "chinese": "中文",    
    "english": "English",
    "japanese": "日本語",
    "korean": "한국어",
}

document.addEventListener('DOMContentLoaded', load);

async function load() {
    const config = await configuration.load();

    const providerSelect = document.querySelector('.select[id="provider"]');
    Object.entries(providers).forEach(([value, name]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = name;
        option.selected = config.provider === value;
        providerSelect.appendChild(option);
    });

    const modelSelect = document.querySelector('.select[id="model"]');
    models[config.provider].forEach((model) => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        option.selected = config.model === model;
        modelSelect.appendChild(option);
    });

    const apiKeyInput = document.querySelector('.input[id="key"]');
    apiKeyInput.value = config.key;

    const apiUrlInput = document.querySelector('.input[id="apiurl"]');
    apiUrlInput.value = config.url;

    const saveButton = document.querySelector('.btn[type="submit"]');
    saveButton.addEventListener('click', save);

    providerSelect.addEventListener('change', function() {
        while (modelSelect.firstChild) {
            modelSelect.removeChild(modelSelect.firstChild);
        }
        models[this.value].forEach((model) => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
        apiKeyInput.value = '';
        apiUrlInput.value = apiUrls[this.value]

        checkKey();
    });

    apiKeyInput.addEventListener('input', checkKey);

    document.querySelector('#btn-groq').addEventListener('click', function() {
        window.open('https://console.groq.com/keys');
    });

    checkKey();
}

function save(event) {
    event.preventDefault();

    const providerSelect = document.querySelector('.select[id="provider"]');
    const modelSelect = document.querySelector('.select[id="model"]');
    const apiKeyInput = document.querySelector('.input[id="key"]');
    const apiUrlInput = document.querySelector('.input[id="apiurl"]');

    const config = {
        provider: providerSelect.value,
        model: modelSelect.value,
        key: apiKeyInput.value,
        url: apiUrlInput.value || apiUrls[providerSelect.value]
    };

    configuration.save(config).then(() => {
        alert('设置已保存。');
    });
}

async function checkKey() {
    const providerSelect = document.querySelector('.select[id="provider"]');
    const apiKeyInput = document.querySelector('.input[id="key"]');

    if (providerSelect.value === configuration.default.provider && apiKeyInput.value === configuration.default.key) {
        document.querySelector('#notice-key').style.display = 'flex';
    } else {
        document.querySelector('#notice-key').style.display = 'none';
    }
}