

class Configuration
{
    storageKey = 'UserConfig';
    default = {
        configs: [],
        lang: '-'
    }

    load() {
        return new Promise((resolve) => {
            chrome.storage.local.get(this.storageKey, data => {
                let config = data[this.storageKey] || this.default;
                if (!config.configs) {
                    config = this.migrate(config);
                }

                let activeConfig = config.configs.find(cfg => cfg.active);
                if (activeConfig) {
                    config = { ...config, ...activeConfig };
                }

                resolve(config);
            });
        });
    }

    save(config) {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                [this.storageKey]: {
                    configs: config.configs,
                    lang: config.lang
                }
            }, resolve);
        });
    }

    reset() {
        return new Promise((resolve) => {
            chrome.storage.local.remove(this.storageKey, resolve);
        });
    }

    migrate(oldConfig) {
        if (oldConfig.key == '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') {
            return this.default;
        }

        let apiType = 'openai';
        let apiUrl = '';
        if (oldConfig.provider === 'groq' || oldConfig.provider === 'openai') {
            apiUrl = oldConfig.url + '/openai/v1/chat/completions';
        } else {
            apiType = 'google';
        }

        let conf = {
            apiType: apiType,
            apiUrl: apiUrl,
            apiKey: oldConfig.key,
            model: oldConfig.model,
            active: true
        }

        let newConfig = {
            configs: [conf],
            lang: '-'
        }

        return newConfig;
    }
}

class Service {
    config = null;
    //prompt = "作为一个专业的翻译助理，请帮我将推文或youtube评论翻译成中文，要求结果通俗易懂，并保留原有格式。我将提供给你这种格式的数据：\n###随机字符串1\nText to be translated 1\n###随机字符串2\nText to be translated 2\n...\n请返回同样的格式，不要添加你的评论或任何markdown标记：\n###随机字符串1\n翻译后的文本1\n###随机字符串2\n翻译后的文本2\n...";
    prompt = "As a professional translation assistant, please help me translate tweets or YouTube comments into {{lang}} in a way that's easy to understand and preserves the original format. I will provide data in this format:\n###randomString1\nText to be translated 1\n###randomString2\nText to be translated 2\n...\nPlease return the same format without adding your own comments or any markdown:\n###randomString1\nTranslated text 1\n###randomString2\nTranslated text 2\n..."; 
    curChunkId = "";
    curLine = "";
    curText = "";

    chunkCallback = null;
    failCallback = null;

    constructor(config) {
        this.config = config;
        this.prompt = this.prompt.replace('{{lang}}', this.config.lang);
    }

    callback(chars, done = false)
    {
        if (done) {
            this.chunkCallback('', '', true);
            return;
        }

        if (chars === "") {
            return;
        }

        if (chars === "\n") {
            const m = this.curLine.match(/^###(\S+)$/);
            if (m) {
                this.curChunkId = m[1];
                this.curText = "";
            } else {
                if (this.curLine.startsWith("#")) {
                    this.curText += this.curLine;
                }

                this.curText += "\n";
                this.chunkCallback(this.curChunkId, this.curText);
            }

            this.curLine = "";
        } else {
            this.curLine += chars;

            if (!this.curLine.startsWith("#")) {
                this.curText += chars;
                this.chunkCallback(this.curChunkId, this.curText);
            }
        }
    }

    async readOpenAiLikeStream(stream) {

        const reader = stream.getReader();
    
        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                const message = line.replace(/^data: /, '');
                if (message === '[DONE]') {
                    this.callback("", true);
                    break; // Stream finished
                }
                
                let parsed = null;
                try {
                    parsed = JSON.parse(message);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    continue;
                }
                
                let content = undefined
                if (parsed.choices !== undefined) {
                    content = parsed.choices[0].delta.content;
                } else if (parsed.candidates !== undefined) {
                    content = parsed.candidates[0].content.parts[0].text
                }            
                if (content !== undefined) {
                    const parts = this.splitContent(content);
                    for (const part of parts) {
                        this.callback(part);
                    }
                } 
            }
        }
    }

    async readGoogleStream(stream) {
        const reader = stream.getReader();

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;

            let chunk = new TextDecoder().decode(value);
            if (chunk.startsWith('[')) {
                chunk = chunk.substring(1);
            }

            if (chunk.startsWith(',')) {
                chunk = chunk.substring(1);
            }

            const endOfStream = chunk.endsWith(']');
            if (endOfStream) {
                chunk = chunk.substring(0, chunk.length - 1);
                if (chunk === '') {
                    this.callback("", true);
                    break;
                }
            }

            let parsed = null;
            try {
                parsed = JSON.parse(chunk);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                continue;
            }

            let content = undefined
            if (parsed.candidates[0].content) {
                content = parsed.candidates[0].content.parts[0].text
            }
            if (content !== undefined) {
                const parts = this.splitContent(content);
                for (const part of parts) {
                    this.callback(part);
                }
            }

            if (endOfStream) {
                this.callback("", true);
                break;
            }
        }

        //
    }

    splitContent(str) {
        let result = [];
        let parts = str.split(/\n/);
        for (let i = 0; i < parts.length; i++) {
            if (i !== 0) {
                result.push('\n');
            }
            result.push(parts[i]);
        }
    
        return result;
    }
}

class OpenAIService extends Service
{

    translate(text, chunkCallback, failCallback = null) {
        this.chunkCallback = chunkCallback;
        this.failCallback = failCallback;

        const apiUrl = this.config.apiUrl;
        const lang = this.config.lang;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+ this.config.apiKey
        };

        const messages = [
            {'role': 'system', 'content': this.prompt},
            {'role': 'user', 'content': text},
        ];

        const data = {
            'model': this.config.model,
            'stream': true,
            'messages': messages,
        }

        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        }).then((response) => {                
            if (!response.ok) {
                this.failCallback(new Error('HTTP Error, Code: ' + response.status));
                return
            }
            
            return response.body;
        })
        .then((stream) => {
            this.readOpenAiLikeStream(stream);
        })
        .catch((error) => {
            console.error(error);
            this.failCallback(error);
        })
    }
}


class GoogleService extends Service
{
    translate(text, chunkCallback, failCallback = null) {
        this.chunkCallback = chunkCallback;
        this.failCallback = failCallback;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`;
        const lang = this.config.lang;

        const headers = {
            'Content-Type': 'application/json'
        };
        
        const data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": this.prompt + '\n原数据: ' + text
                        }
                    ]
                }
            ]
        }
        
        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        }).then((response) => {                
            if (!response.ok) {
                throw new Error('HTTP Error, Code: ' + response.status);
                //this.failCallback(new Error('HTTP Error, Code: ' + response.status));
                return
            }
            
            return response.body;
        })
        .then((stream) => {
            this.readGoogleStream(stream);
        })
        .catch((error) => {
            console.error(error);
            this.failCallback(error);
        })
    }
}

const configuration = new Configuration();

export { configuration, OpenAIService, GoogleService }