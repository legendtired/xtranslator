// i18n
const _i18n = {
	'zh-cn': {
		'placeholder-demo': '占位符: {value1}, 占位符: {value2}',
		'settings': '设置',
		'extension-settings': '插件设置',
		'switch-conf': '切换设置',
		'new': '新建',
		'new-config': '新建配置',
		'edit': '编辑',
		'active': '已启用',
		'cancel': '取消',
		'delete': '删除',
		'save': '保存',
		'trial': '试用',
		'save-all': '保存设置',
		'target-language': '目标语言',
		'please-select': '请选择',
		'api-type': 'API类型',
		'openai-or-openai-compatible': 'OpenAI 或 兼容 OpenAI 格式的 API',
		'full-api-url': 'API 地址（全）',
		'model': '模型',
		'api-url-placeholder': '请输入或从列表中选择，注意要填写完整的API地址',
		'model-placeholder': '请填写或从列表中选择对应模型',
		'api-url-required': 'API URL 不能为空。',
		'api-key-required': 'API Key 不能为空。',
		'model-required': '请选择模型。',
		'save-success': '保存成功',
		'zero-config-warning': '您尚未设置翻译引擎，请先完成插件设置',
		'zero-config-tips': '本插件使用AI厂商提供的API接口来实现翻译功能，如果您已经拥有OpenAI或其他厂商的API Key，可以新建配置并选择合适的模型；如果没有，可前往 <a href="https://console.groq.com/keys" target="_blank">Groq Cloud</a> 或 <a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek</a> 申请免费的API Key。',
		'translate': '翻译',
		'x-batch-translate': '翻译推文及评论',
		'y-batch-translate': '翻译评论',
	},

	'en': {
		'placeholder-demo': 'Placeholder: {value1}, Placeholder: {value2}',
		'settings': 'Settings',
		'extension-settings': 'Extension Settings',
		'switch-conf': 'Switch Configuration',
		'new': 'New',
		'new-config': 'New Configuration',
		'edit': 'Edit',
		'active': 'Active',
		'cancel': 'Cancel',
		'delete': 'Delete',
		'save': 'Save',
		'trial': 'Trial',
		'save-all': 'Save All',
		'target-language': 'Target Language',
		'please-select': 'Please Select',
		'api-type': 'API Type',
		'openai-or-openai-compatible': 'OpenAI or OpenAI Compatible API',
		'full-api-url': 'Full API URL',
		'model': 'Model',
		'api-url-placeholder': 'Please enter or select from the list, make sure to fill in the full API URL',
		'model-placeholder': 'Please enter or select the corresponding model from the list',
		'api-url-required': 'API URL is required.',
		'api-key-required': 'API Key is required.',
		'model-required': 'Please select a model.',
		'save-success': 'Save success',
		'zero-config-warning': 'You have not set up a translation engine yet, please complete the plugin settings first',
		'zero-config-tips': 'This plugin uses API interfaces provided by AI vendors to implement translation functions. If you already have an OpenAI or other vendor API Key, you can create a new configuration and select the appropriate model; if not, you can go to <a href="https://console.groq.com/keys" target="_blank">Groq Cloud</a> or <a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek</a> to apply for a free API Key.',
		'translate': 'Translate',
		'x-batch-translate': 'Translate Tweets and Comments',
		'y-batch-translate': 'Translate Comments',
	},

	'ja': {
		'placeholder-demo': 'Placeholder: {value1}, Placeholder: {value2}',
		'settings': '設定',
		'extension-settings': '拡張機能の設定',
		'switch-conf': '設定を切り替える',
		'new': '新しい',
		'new-config': '新しい設定',
		'edit': '編集',
		'active': 'アクティブ',
		'cancel': 'キャンセル',
		'delete': '削除',
		'save': '保存',
		'trial': 'トライアル',
		'save-all': 'すべて保存',
		'target-language': 'ターゲット言語',
		'please-select': '選択してください',
		'api-type': 'APIタイプ',
		'openai-or-openai-compatible': 'OpenAIまたはOpenAI互換API',
		'full-api-url': '完全なAPI URL',
		'model': 'モデル',
		'api-url-placeholder': '入力してください、またはリストから選択してください、完全なAPI URLを入力してください',
		'model-placeholder': 'リストから対応するモデルを選択してください',
		'api-url-required': 'API URLは必須です。',
		'api-key-required': 'APIキーは必須です。',
		'model-required': 'モデルを選択してください。',
		'save-success': '保存に成功しました',
		'zero-config-warning': 'まだ翻訳エンジンを設定していません。まずプラグインの設定を完了してください',
		'zero-config-tips': 'このプラグインは、AIベンダーが提供するAPIインターフェースを使用して翻訳機能を実装します。 OpenAIまたは他のベンダーAPIキーをすでにお持ちの場合は、適切なモデルを選択して新しい構成を作成できます。そうでない場合は、<a href="https://console.groq.com/keys" target="_blank">Groq Cloud</a>または<a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek</a>に移動して、無料のAPIキーを申請できます。',
		'translate': '翻訳',
		'x-batch-translate': 'ツイートとコメントを翻訳',
		'y-batch-translate': 'コメントを翻訳',
	},
}

function $t(key, replacements = null) {

	let lang = navigator.language || navigator.userLanguage;
	lang = lang.toLowerCase();

	if(lang == 'zh-tw') {
		lang = 'zh-cn';
	}
	
	let arr = ["zh-cn","en","ja"];
	if(!arr.includes(lang)) {
		lang = "en";
	}

	let value = _i18n[lang][key] || _i18n['en'][key] || key;

	if (replacements) {
		value = value.replace(/\{\w+\}/g, function (placeholder) {
		    var k = placeholder.replace('{', '').replace('}', '')

		    if (replacements[k] !== undefined) {
		      return replacements[k]
		    }

		    return placeholder
		});
	}

	return value;
}

if (typeof Vue != 'undefined') {
	Vue.prototype.$t = $t;

	Vue.filter('t', function (key, replacements = {}) {
		return $t(key, replacements);
	})
}

export { $t };