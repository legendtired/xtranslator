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
        const contentNode = node.querySelector('ytd-expander yt-attributed-string')
        contentNode.setAttribute('data-xtid', id);
        const comment = {
            'id': id,
            'text': contentNode.textContent
        }

        comments.push(comment);
    }
    
    commentNodesForTranslation = [];

    let text = '';
    comments.forEach((comment) => {
        text += `###${comment.id}\n${comment.text}\n`;
    });    

    translateCommentText(text)
}

async function translateCommentText(text) {
    let translationService = null;

    const config = await configuration.load();
    if (config.configs.length == 0) {
        return;
    }

    const apiType = config.apiType;
    if (apiType === 'google') {
        translationService = new GoogleService(config);
    } else {
        translationService = new OpenAIService(config);
    }
    
    return translationService.translate(text, chunkCallback, failCallback);
}

function addBatchTranslationButton(node) {
    let translateButton = document.createElement('a');
    translateButton.innerText = $t('y-batch-translate');
    translateButton.classList.add('translate-button');
    translateButton.classList.add('batch-translate-button');
    if (shouldTranslateComments) {
        translateButton.classList.add('ct-auto');
    }

    translateButton.addEventListener('click', function(e) {        
        shouldTranslateComments = !shouldTranslateComments;
        if (!shouldTranslateComments) {
            e.target.classList.remove('ct-auto');
            return;
        }

        e.target.classList.add('ct-auto');

        commentNodesForTranslation = document.querySelectorAll('ytd-comment-thread-renderer ytd-expander');
        
        performTranslation();
        checkConfiguration();
    });

    node.querySelector('div[id="title"]').appendChild(translateButton);
}

function chunkCallback(id, text = '', done = false) {

    if (done) {
        return;
    }

    const commentNode = document.querySelector('yt-attributed-string[data-xtid="' + id + '"]');
    if (!commentNode) {
        return;
    }

    let resultNode = commentNode.querySelector('.translate-result');
    if (!resultNode) {
        resultNode = document.createElement('div');
        resultNode.innerText = text;
        resultNode.classList.add('translate-result');
        commentNode.appendChild(resultNode);
    }
  
    resultNode.textContent = text
}

function failCallback(error) {
    console.error(error);
    showToast(error.message)
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