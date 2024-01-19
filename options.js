import { configuration } from '/modules.js';

const providers = {
    "openai": "OpenAI",
    "google": "Google"
};

const models = {
    "openai": [
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-16k",
        "gpt-3.5-turbo-0613",
        "gpt-3.5-turbo-1106",
        "gpt-4",
        "gpt-4-32k",
        "gpt-4-0613",
        "gpt-4-1106-preview"
    ],
    "google": [
        "gemini-pro",
    ]
};

const apiUrls = {
    "openai": "https://api.openai.com",
    "google": "https://generativelanguage.googleapis.com"
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
    });
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
