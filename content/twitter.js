(async () => {
    const { configuration, OpenAIService, GoogleService, GroqService } = await import(chrome.runtime.getURL('modules.js'));
    window.configuration = configuration;
    window.OpenAIService = OpenAIService;
    window.GoogleService = GoogleService;
    window.GroqService = GroqService;
})();

let originalTweetNode = null;
let originalTweetText = '';

let isOnTweetPage = false;
let shouldTranslateReplies = false;

let tweetNodesForTranslation = [];
let delayBetweenTranslations = 1000;
let translationTimerId = null;

function performTranslation() {

    if (isOnTweetPage && !shouldTranslateReplies) {
        return;
    }

    const tweets = [];
    if (isOnTweetPage && originalTweetText) {
        tweets.push({
            'id': null,
            'text': originalTweetText
        });
    }

    for (let node of tweetNodesForTranslation) {
        const tweet = {
            'id': node.id,
            'text': node.textContent
        }

        tweets.push(tweet);
    }

    //console.log(JSON.stringify(tweets));
    
    tweetNodesForTranslation = [];

    translateTweetText(JSON.stringify(tweets))
    .then((tweetsText) => {
        console.log(tweetsText);
        const tweets = JSON.parse(tweetsText);
        for (let tweet of tweets) {
            appendTranslationResult(tweet.id, tweet.text);
        }
    }).catch((error) => {
        console.log(error);
    }).finally(() => {
        const loadingNodes = document.querySelectorAll('.ct-loading');
        for (let node of loadingNodes) {
            node.classList.remove('ct-loading');
        }
    });
}

function appendTranslationResult(id, text) {
    const commentNode = document.getElementById(id);
    if (!commentNode) {
        return;
    }

    const translationDiv = document.createElement('div');
    translationDiv.innerText = text;
    translationDiv.classList.add('translate-result');
    commentNode.appendChild(translationDiv);
}

async function translateTweetText(text) {
    let translationService = null;

    const config = await configuration.load();
    const provider = config.provider;
    if (provider === 'groq') {
        translationService = new GroqService(config);
    } else if (provider === 'google') {
        translationService = new GoogleService(config);
    } else {
        translationService = new OpenAIService(config);
    }
    
    return translationService.translate(text);
}

function addBatchTranslationButton() {
    let translateButton = document.createElement('a');
    translateButton.innerText = '翻译推文及评论';
    translateButton.classList.add('translate-button');
    translateButton.classList.add('batch-translate-button');
    translateButton.addEventListener('click', function(e) {
        shouldTranslateReplies = !shouldTranslateReplies;
        e.target.classList.add('ct-loading');
        tweetNodesForTranslation = document.querySelectorAll('div[data-testid="tweetText"]');
        performTranslation();
    });

    originalTweetNode.querySelector('div > div > div:nth-child(3) > div:nth-child(4) div').appendChild(translateButton);
}

function addSingleTweetTranslationButton(tweetNode) {
    let translateButton = document.createElement('a');
    translateButton.innerText = '翻译';
    translateButton.classList.add('translate-button');
    translateButton.classList.add('tweet-translate-button');
    translateButton.addEventListener('click', function(e) {
        shouldTranslateReplies = false;
        e.target.classList.add('ct-loading');
        tweetNodesForTranslation = e.target.closest('article[tabindex="0"]').querySelectorAll('div[data-testid="tweetText"]')
        performTranslation();
    });

    const caretNode = tweetNode.querySelector('div[data-testid="caret"]');
    if (caretNode && caretNode.parentElement.querySelector('.translate-button') === null) {
        caretNode.parentElement.prepend(translateButton);
    }
}

function observeDOMChanges() {
    let observer = new MutationObserver((mutations) => {
        isOnTweetPage = window.location.href.indexOf('/status/') > -1;
        if (!isOnTweetPage) {
            shouldTranslateReplies = false;
        }

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('data-testid') === 'cellInnerDiv') {
                        if (node.querySelector('article[tabindex="-1"]')) {
                            originalTweetNode = node.querySelector('article[tabindex="-1"]');
                            originalTweetText = originalTweetNode.querySelector('div[data-testid="tweetText"]').textContent;
                            addBatchTranslationButton();
                        }

                        if (isOnTweetPage && node.querySelector('div[data-testid="tweetText"]')) {
                            tweetNodesForTranslation.push(node.querySelector('div[data-testid="tweetText"]'));
                            clearTimeout(translationTimerId);
                            translationTimerId = setTimeout(performTranslation, delayBetweenTranslations);
                        }

                        if (!isOnTweetPage && node.querySelector('article[tabindex="0"]')) {
                            addSingleTweetTranslationButton(node);
                        }
                    } else if (!isOnTweetPage && node.querySelector('div[data-testid="caret"]') && node.closest('article[tabindex="0"]')) {
                        addSingleTweetTranslationButton(node);
                    }
                });
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}


observeDOMChanges();