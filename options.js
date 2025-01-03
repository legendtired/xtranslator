import { configuration } from '/modules.js';
import { $t } from '/i18n.js';

var vueOpts = {
    el: "#app",
    data: {
        editing: false,
        config: {
            configs: [],
            lang: 'chinese',
        },
        activeConfigIndex: -1,
        currentConfig: {
            apiType: "openai",
            apiUrl: "",
            apiKey: "",
            model: "",
            trial: false,
        },
        apiUrlOptions: [
            { label: "OpenAI", value: "https://api.openai.com/v1/chat/completions" },
            { label: "Groq", value: "https://api.groq.com/openai/v1/chat/completions" },
            { label: "DeepSeek", value: "https://api.deepseek.com/chat/completions" },
        ],
        modelOptions: [
            { label: "OpenAI", value: "gpt-3.5-turbo" },
            { label: "OpenAI", value: "gpt-4o" },
            { label: "DeepSeekV3", value: "deepseek-chat" },
            { label: "Groq", value: "llama3-70b-8192" },
            { label: "Groq", value: "gemma2-9b-it" },
            { label: 'Groq', value: 'llama-3.3-70b-versatile' },
            { label: "Groq", value: "mixtral-8x7b-32768" },
            { label: "Google", value: "gemini-1.5-pro" },
            { label: "Google", value: "gemini-1.5-flash" },
            { label: "Google", value: "gemini-1.5-flash-8b" },
            { label: "Google", value: "gemini-2.0-flash-exp" },
        ],
    },
    methods: {
        async init() {
            const config = await configuration.load();
            this.config = config;

            if (this.config.lang == '-') {
                let lang = navigator.language || navigator.userLanguage;
                const langMap = {
                    zh: 'chinese',
                    en: 'english',
                    ja: 'japanese',
                    ko: 'korean',
                    fr: 'french',
                    es: 'spanish',
                    de: 'german',
                    ar: 'arabic',
                    ru: 'russian',
                };

                for (const [key, value] of Object.entries(langMap)) {
                    if (lang.includes(key)) {
                        this.config.lang = value;
                        break;
                    }
                }
            }
        },

        new() {
            this.activeConfigIndex = -1;
            this.currentConfig = {
                apiType: "openai",
                apiUrl: "",
                apiKey: "",
                model: "",
                trial: false,
                active: false,
            };
            this.editing = true;
        },

        async select(index = -1) {
            console.log("select", index);
            
            this.config.configs.forEach((cfg, idx) => {
                cfg.active = idx == index;
            });

            await configuration.save(this.config);
        },

        edit(index = 0) {
            console.log("edit");

            this.activeConfigIndex = index;
            const cfg = this.config.configs[index];
            this.currentConfig = { ...cfg };
            this.editing = true;
        },

        async delete() {
            console.log("delete");

            this.config.configs.splice(this.activeConfigIndex, 1);
            await configuration.save(this.config);

            this.activeConfigIndex = -1;
            this.editing = false;
        },

        cancel() {
            console.log("cancel");
            this.editing = false;
        },

        apiUrlInputChanged(value) {
            console.log("apiUrlInputChanged--", value);
            this.currentConfig.apiUrl = value;
        },

        modelInputChanged(value) {
            console.log("modelInputChanged--", value);
            this.currentConfig.model = value;
        },

        async saveConfig() {
            if (this.currentConfig.apiType != 'google' && !this.currentConfig.apiUrl) {
                alert($t('api-url-required'));
                return;
            }

            if (!this.currentConfig.model) {
                alert($t('model-required'));
                return;
            }

            if (!this.currentConfig.apiKey) {
                alert($t('api-key-required'));
                return;
            }

            if (this.activeConfigIndex >= 0) {
                this.config.configs.splice(this.activeConfigIndex, 1, {
                    ...this.currentConfig,
                });
            } else {
                this.config.configs.push({ ...this.currentConfig });
            }

            await configuration.save(this.config);

            this.activeConfigIndex = -1;
            this.editing = false;
            alert($t('save-success'));
        },

        async save() {
            console.log("save");

            await configuration.save(this.config);
            alert($t('save-success'));
        },
    },

    created: function () {
        console.log("mounted");
        this.init();
    },
};

Vue.component("dropdown-input", {
    template: `
      <div class="flex flex-col relative">
        <input 
          type="text" 
          class="input input-bordered flex-grow" 
          :value="value"
          :placeholder="placeholder"
          @input="updateValue($event.target.value)"
          @click="showDropdown = true"
        >
        <div 
          v-show="showDropdown"
          v-el:dropdown
          class="absolute w-full top-12 bg-white border rounded-md shadow-lg z-10"
        >
          <div
            v-for="option in options"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-1 text-sm"
            @mousedown.prevent="selectOption(option)"
          >
            <span class="font-bold">{{ option.label }}</span>
            <span class="text-gray-500">{{ option.value }}</span>
          </div>
        </div>
      </div>
    `,
    props: ["value", "placeholder", "options"],
    data: function () {
        return {
            showDropdown: false,
        };
    },
    ready: function () {
        document.addEventListener("click", this.handleClickOutside);
    },
    beforeDestroy: function () {
        document.removeEventListener("click", this.handleClickOutside);
    },
    methods: {
        updateValue: function (value) {
            //console.log("updateValue--", typeof(value));
            this.$emit("changed", value);
        },
        selectOption: function (option) {
            this.$emit("changed", option.value);
            this.showDropdown = false;
        },
        handleClickOutside: function (event) {
            var dropdown = this.$els.dropdown;
            if (
                dropdown &&
                !dropdown.contains(event.target) &&
                !event.target.classList.contains("input")
            ) {
                this.showDropdown = false;
            }
        },
    },
});

new Vue(vueOpts);
