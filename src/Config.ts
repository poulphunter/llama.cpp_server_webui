import daisyuiThemes from 'daisyui/src/theming/themes';

export const isDev = import.meta.env.MODE === 'development';

// constants

// h parameter can be passed through the app url to change the BASE_URL
// ex, if the app is located at : http://localhost:5173
// this url : http://localhost:5173/?h=https%3A%2F%2Ftest.example.com%3A8080%2Fapi
// will configure BASE_URL as https://test.example.com:8080/api
function parseHashParams(hash: string): Record<string, string> {
  const parameters:Record<string, string> = {};
  hash.replace(/^#?/, '').split('&').forEach((param) => {
    const [key, value] = param.split('=');
    parameters[key] = decodeURIComponent(value || '');
  });
  return parameters;
}

export const BASE_URL:string =
  parseHashParams(window.location.hash)['h'] ??
  parseHashParams(window.location.hash)['host'] ??
  new URL('.', document.baseURI).href.toString().replace(/\/$/, '');

export const ENCRYPT_KEY:string =
  parseHashParams(window.location.hash)['k'] ??
  parseHashParams(window.location.hash)['key'] ??
  '';
export const INIT_MESSAGE:string =
  parseHashParams(window.location.hash)['m'] ??
  parseHashParams(window.location.hash)['message'] ??
  '';
export const INIT_QUERY:string =
  parseHashParams(window.location.hash)['q'] ??
  parseHashParams(window.location.hash)['query'] ??
  '';

export type CONFIG_DEFAULT_KEY = string | boolean | number | string[];
export const CONFIG_DEFAULT = {
  // Note: in order not to introduce breaking changes, please keep the same data type (number, string, etc.) if you want to change the default value. Do not use null or undefined for default value.
  // Do not use nested objects, keep it single level. Prefix the key if you need to group them.
  apiKey: '',
  systemMessage: 'You are a helpful assistant.',
  showTokensPerSecond: false,
  showThoughtInProgress: false,
  excludeThoughtOnReq: true,
  // make sure these default values are in sync with `common.h`
  samplers: 'edkypmxt',
  temperature: 0.8,
  dynatemp_range: 0.0,
  dynatemp_exponent: 1.0,
  top_k: 40,
  top_p: 0.95,
  min_p: 0.05,
  xtc_probability: 0.0,
  xtc_threshold: 0.1,
  typical_p: 1.0,
  repeat_last_n: 64,
  repeat_penalty: 1.0,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
  dry_multiplier: 0.0,
  dry_base: 1.75,
  dry_allowed_length: 2,
  dry_penalty_last_n: -1,
  max_tokens: -1,
  custom: '', // custom json-stringified object
  // experimental features
  pyIntepreterEnabled: false,
  questionIdeas: [''],
};
export const PROMPT_JSON = [
  {
    name: '',
    lang: '',
    config: CONFIG_DEFAULT,
  },
];
// list of themes supported by daisyui
export const THEMES = ['light', 'dark']
  // make sure light & dark are always at the beginning
  .concat(
    Object.keys(daisyuiThemes).filter((t) => t !== 'light' && t !== 'dark')
  );
