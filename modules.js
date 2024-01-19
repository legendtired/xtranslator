

class Configuration
{
    storageKey = 'UserConfig';
    default = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        key: '',
        url: 'https://api.openai.com/v1/chat/completions',
        lang: 'chinese'
    }

    load() {
        console.log(this.storageKey);
        return new Promise((resolve) => {
            chrome.storage.local.get(this.storageKey, data => {
                const config = data[this.storageKey] || this.default;
                resolve(config);
            });
        });
    }

    save(config) {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                [this.storageKey]: config
            }, resolve);
        });
    }

    reset() {
        return new Promise((resolve) => {
            chrome.storage.local.remove(this.storageKey, resolve);
        });
    }
}

class OpenAIService
{
    config = null;

    constructor(config) {
        this.config = config;
    }

    translate(text) {
        return new Promise((resolve, reject) => {
            const apiUrl = `${this.config.url}/v1/chat/completions`;
            const key = this.config.key;
            const lang = this.config.lang;
    
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+ key
            };
    
            const messages = [
                {'role': 'system', 'content': 'As a professional translation assistant, please help me translate original posts and comments from Twitter or YouTube into a natural tone. Also, parse the JSON data I provide, translate all text fields into Chinese, and return the JSON data in the same format as the input. Only return the JSON data, without any markdown notation: [{"id": "id", "text": "Translation result..."}, {"id": "id", "text": "Translation result..."}]'},
                {'role': 'user', 'content': text},
            ];
    
            const data = {
                'model': this.config.model,
                'messages': messages,
            }
            
            fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            }).then((response) => {
                console.log(response);
                return response.json();
            }).then((data) => {
                console.log(data);
                const translatedText = data['choices'][0]['message']['content'];
                resolve(translatedText);
            }).catch((error) => {
                console.log(error);
                reject(error);
            })
        });
    }
}


class GoogleService
{
    config = null;

    constructor(config) {
        this.config = config;
    }

    translate(text) {
        return new Promise((resolve, reject) => {
            const apiUrl = `${this.config.url}/v1beta/models/${this.config.model}:generateContent?key=${this.config.key}`;            
            const lang = this.config.lang;
    
            const headers = {
                'Content-Type': 'application/json'
            };
            
            const data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": 'As a professional translation assistant, please help me translate original posts and comments from Twitter or YouTube into a natural tone. Also, parse the JSON data I provide, translate all text fields into Chinese, and return the JSON data in the same format as the input. Only return the JSON data, without any markdown notation, output sample: [{"id": "id", "text": "Translation result..."}, {"id": "id", "text": "Translation result..."}]\ninput: ' + text
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
                console.log(response);
                return response.json();
            }).then((data) => {
                const translatedText = data['candidates'][0]['content']['parts'][0]['text'];
                resolve(translatedText);
            }).catch((error) => {
                console.log(error);
                reject(error);
            })
        });
    }
}


const configuration = new Configuration();

export { configuration, OpenAIService, GoogleService }