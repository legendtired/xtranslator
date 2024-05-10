(async () => {
    const { configuration, OpenAIService, GoogleService, GroqService } = await import(chrome.runtime.getURL('modules.js'));
    window.configuration = configuration;
    window.OpenAIService = OpenAIService;
    window.GoogleService = GoogleService;
    window.GroqService = GroqService;
})();

async function checkConfiguration() {
    const config = await configuration.load();
    if (config.provider === configuration.default.provider && config.key === configuration.default.key) {
        showToast('您正在使用内置的Groq API KEY, 仅用于体验用途，有频率限制，请前往Groq官网申请您自己的免费API KEY，然后在插件设置中替换。', 5000, { text: '了解更多', handler: () => chrome.runtime.sendMessage({action: "openOptionsPage"}) });
    }
}

function showToast(message, duration = 3000, action = null) {
    let toast = document.createElement('div');
    toast.className = 'translate-toast';

    let icon = document.createElement('img');
    icon.className = 'xt-icon';
    icon.src = chrome.runtime.getURL('assets/icon128.png');
    toast.appendChild(icon);

    let toastMessage = document.createElement('p');
    toastMessage.className = '.xt-message';
    toastMessage.innerText = message;
    toast.appendChild(toastMessage);

    if (action) {
        let actionButton = document.createElement('button');
        actionButton.className = 'xt-action';
        actionButton.innerText = action.text;
        actionButton.addEventListener('click', action.handler);
        toast.appendChild(actionButton);
    }

    toast.style.opacity = '1';
    document.body.appendChild(toast);
    
    
    setTimeout(function() {
        toast.style.opacity = '0';
    }, duration);
    
    toast.addEventListener('transitionend', function() {
        if (toast.style.opacity == '0') {
            document.body.removeChild(toast);
        }
    });
}