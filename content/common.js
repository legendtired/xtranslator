(async () => {
    const { $t } = await import(chrome.runtime.getURL('i18n.js'));
    window.$t = $t;
})();

(async () => {
    const { configuration, OpenAIService, GoogleService } = await import(chrome.runtime.getURL('modules.js'));
    window.configuration = configuration;
    window.OpenAIService = OpenAIService;
    window.GoogleService = GoogleService;
})();

async function checkConfiguration() {
    const config = await configuration.load();
    if (config.configs.length == 0) {
        showToast( $t('zero-config-warning'), 5000, { text: $t('extension-settings'), handler: () => chrome.runtime.sendMessage({action: "openOptionsPage"}) });
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