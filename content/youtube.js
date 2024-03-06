(async () => {
    const { configuration, OpenAIService, GoogleService, GroqService } = await import(chrome.runtime.getURL('modules.js'));
    window.configuration = configuration;
    window.OpenAIService = OpenAIService;
    window.GoogleService = GoogleService;
    window.GroqService = GroqService;
})();

let shouldTranslateComments = false;

let commentNodesForTranslation = [];
let delayBetweenTranslations = 1000;
let translationTimerId = null;

function performTranslation() {

    if (!shouldTranslateComments) {
        return;
    }

    const comments = [];

    for (let node of commentNodesForTranslation) {
        const id = Math.random().toString(36).substring(2);
        const contentNode = node.querySelector('ytd-expander yt-formatted-string')
        contentNode.setAttribute('data-xtid', id);
        const comment = {
            'id': id,
            'text': contentNode.textContent
        }

        comments.push(comment);
    }

    //console.log(JSON.stringify(comments));
    
    commentNodesForTranslation = [];

    translateCommentText(JSON.stringify(comments))
    .then((commentsText) => {
        console.log(commentsText);
        const comments = JSON.parse(commentsText);
        for (let comment of comments) {
            appendTranslationResult(comment.id, comment.text);
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

async function translateCommentText(text) {
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

function appendTranslationResult(id, text) {
    const commentNode = document.querySelector('yt-formatted-string[data-xtid="' + id + '"]');
    if (!commentNode) {
        return;
    }

    const translationDiv = document.createElement('div');
    translationDiv.innerText = text;
    translationDiv.classList.add('translate-result');
    commentNode.closest('ytd-expander').appendChild(translationDiv);
}

function addBatchTranslationButton(node) {
    let translateButton = document.createElement('a');
    translateButton.innerText = '翻译评论';
    translateButton.classList.add('translate-button');
    translateButton.classList.add('batch-translate-button');
    translateButton.addEventListener('click', function(e) {
        shouldTranslateComments = !shouldTranslateComments;
        e.target.classList.add('ct-loading');
        commentNodesForTranslation = document.querySelectorAll('ytd-comment-renderer ytd-expander');
        performTranslation();
    });

    node.querySelector('div[id="title"]').appendChild(translateButton);
}

function observeDOMChanges() {
    console.log('loaded');

    let observer = new MutationObserver((mutations) => {
        isOnTweetPage = window.location.href.indexOf('/status/') > -1;
        if (!isOnTweetPage) {
            shouldTranslateReplies = false;
        }

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() == 'ytd-comments-header-renderer') {
                        shouldTranslateComments = false;
                        if (!node.querySelector('.translate-button')) {
                            addBatchTranslationButton(node);
                        }
                    }

                    if (node.nodeType === Node.ELEMENT_NODE && (node.tagName.toLowerCase() == 'ytd-comment-renderer' || node.tagName.toLowerCase() == 'ytd-comment-thread-renderer')) {
                        if (node.querySelector('.translate-result')) {
                            node.querySelector('.translate-result').remove();
                        }

                        commentNodesForTranslation.push(node.querySelector('ytd-expander'));
                        clearTimeout(translationTimerId);
                        translationTimerId = setTimeout(performTranslation, delayBetweenTranslations);
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