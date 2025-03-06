import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  APIMessage,
  CanvasData,
  Conversation,
  Message,
  PendingMessage,
  ViewingChat,
} from './types';
import StorageUtils from './storage';
import {
  cleanCurrentUrl,
  filterThoughtFromMsgs,
  getSSEStreamAsync,
  isBoolean,
  isNumeric,
  isString,
  normalizeMsgsForAPI,
} from './misc';
import { BASE_URL, CONFIG_DEFAULT, isDev } from '../Config';
import { matchPath, useLocation, useNavigate } from 'react-router';
import useStateCallback from './UseStateCallback.tsx';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

type languageOption = { language: string; code: string };

const PROMPT_JSON = [
  {
    name: '',
    lang: '',
    config: CONFIG_DEFAULT,
  },
];

interface AppContextValue {
  // conversations and messages
  viewingChat: ViewingChat | null;
  pendingMessages: Record<Conversation['id'], PendingMessage>;
  isGenerating: (convId: string) => boolean;
  sendMessage: (
    convId: string | null,
    leafNodeId: Message['id'] | null,
    content: string,
    extra: Message['extra'],
    onChunk: CallbackGeneratedChunk
  ) => Promise<boolean>;
  stopGenerating: (convId: string) => void;
  replaceMessageAndGenerate: (
    convId: string,
    parentNodeId: Message['id'], // the parent node of the message to be replaced
    content: string | null,
    extra: Message['extra'],
    onChunk: CallbackGeneratedChunk
  ) => Promise<void>;

  // canvas
  canvasData: CanvasData | null;
  setCanvasData: (data: CanvasData | null) => void;

  // config
  config: typeof CONFIG_DEFAULT;
  saveConfig: (config: typeof CONFIG_DEFAULT) => void;
  settingsSeed: number;
  resetSettings: () => void;
  closeDropDownMenu: (e: string) => void;
  setPromptSelectOptions: (e: { key: number; value: string }[]) => void;
  promptSelectOptions: { key: number; value: string }[];
  promptSelectConfig: typeof PROMPT_JSON | null;
  setPromptSelectConfig: (
    value: React.SetStateAction<typeof PROMPT_JSON | null>,
    callback?: (value?: React.SetStateAction<typeof PROMPT_JSON | null>) => void
  ) => void;
  promptSelectFirstConfig: number;
  setPromptSelectFirstConfig: (e: number) => void;
  languageOptions: languageOption[];
  language: string;
  setLanguage: (
    value: React.SetStateAction<string>,
    callback?: (value?: React.SetStateAction<string>) => void
  ) => void;
  promptSeed: number;
  resetPromptSeed: () => void;
  isConfigOk: (config: typeof CONFIG_DEFAULT) => string;
}

// this callback is used for scrolling to the bottom of the chat and switching to the last node
export type CallbackGeneratedChunk = (currLeafNodeId?: Message['id']) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AppContext = createContext<AppContextValue>({} as any);

const getViewingChat = async (convId: string): Promise<ViewingChat | null> => {
  const conv = await StorageUtils.getOneConversation(convId);
  if (!conv) return null;
  return {
    conv: conv,
    // all messages from all branches, not filtered by last node
    messages: await StorageUtils.getMessages(convId),
  };
};

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  if (new URL(window.location.href).searchParams.has('h')) {
    cleanCurrentUrl(['h']);
  }
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = matchPath('/chat/:convId', pathname);
  const convId = params?.params?.convId;

  const [viewingChat, setViewingChat] = useState<ViewingChat | null>(null);
  const [pendingMessages, setPendingMessages] = useState<
    Record<Conversation['id'], PendingMessage>
  >({});
  const [aborts, setAborts] = useState<
    Record<Conversation['id'], AbortController>
  >({});
  const [config, setConfig] = useState(StorageUtils.getConfig());
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [settingsSeed, setSettingsSeed] = useState(1);
  const [promptSeed, setPromptSeed] = useState(42);
  const resetSettings = useCallback(() => {
    // eslint-disable-next-line sonarjs/pseudo-random
    setSettingsSeed(Math.random());
  }, []);
  const resetPromptSeed = () => {
    // eslint-disable-next-line sonarjs/pseudo-random
    setPromptSeed(Math.random());
  };

  // handle change when the convId from URL is changed
  useEffect(() => {
    // also reset the canvas data
    setCanvasData(null);
    const handleConversationChange = async (changedConvId: string) => {
      if (changedConvId !== convId) return;
      setViewingChat(await getViewingChat(changedConvId));
    };
    StorageUtils.onConversationChanged(handleConversationChange);
    getViewingChat(convId ?? '').then(setViewingChat);
    return () => {
      StorageUtils.offConversationChanged(handleConversationChange);
    };
  }, [convId]);

  const setPending = (convId: string, pendingMsg: PendingMessage | null) => {
    // if pendingMsg is null, remove the key from the object
    if (!pendingMsg) {
      setPendingMessages((prev) => {
        const newState = { ...prev };
        delete newState[convId];
        return newState;
      });
    } else {
      setPendingMessages((prev) => ({ ...prev, [convId]: pendingMsg }));
    }
  };

  const setAbort = (convId: string, controller: AbortController | null) => {
    if (!controller) {
      setAborts((prev) => {
        const newState = { ...prev };
        delete newState[convId];
        return newState;
      });
    } else {
      setAborts((prev) => ({ ...prev, [convId]: controller }));
    }
  };

  ////////////////////////////////////////////////////////////////////////
  // public functions

  const isNumericTest = (
    val: string | boolean | number | string[],
    conf: typeof CONFIG_DEFAULT,
    key: string
  ): boolean => {
    const trimmedValue = val.toString().trim();
    const numVal = Number(trimmedValue);
    if (isNaN(numVal) || !isNumeric(numVal) || trimmedValue.length === 0) {
      return false;
    }
    // force conversion to number
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    conf[key] = numVal;
    return true;
  };

  const isConfigOk = (conf: typeof CONFIG_DEFAULT): string => {
    for (const key in conf) {
      const val: string | boolean | number | string[] =
        conf[key as keyof typeof CONFIG_DEFAULT];
      const mustBeBoolean = isBoolean(
        CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
      );
      const mustBeString = isString(
        CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
      );
      const mustBeNumeric = isNumeric(
        CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
      );
      const mustBeArray = Array.isArray(
        CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
      );
      if (mustBeString && !isString(val)) {
        return (
          t('Settings.labels.handleSave1') +
          ' ' +
          key +
          ' ' +
          t('Settings.labels.handleSave2')
        );
      }
      if (mustBeNumeric && !isNumericTest(val, conf, key)) {
        return (
          t('Settings.labels.handleSave1') +
          ' ' +
          key +
          ' ' +
          t('Settings.labels.handleSave3')
        );
      }
      if (mustBeBoolean && !isBoolean(val)) {
        return (
          t('Settings.labels.handleSave1') +
          ' ' +
          key +
          ' ' +
          t('Settings.labels.handleSave4')
        );
      }
      if (mustBeArray && !Array.isArray(val)) {
        return (
          t('Settings.labels.handleSave1') +
          ' ' +
          key +
          ' ' +
          t('Settings.labels.handleSave5')
        );
      }
      if (!(mustBeBoolean || mustBeNumeric || mustBeString || mustBeArray)) {
        return `Unknown default type for key ${key}`;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      conf[key] = val;
    }
    return '';
  };

  const isGenerating = (convId: string) => !!pendingMessages[convId];

  const generateMessageInitCheck = async (
    convId: string,
    leafNodeId: Message['id']
  ): Promise<
    [
      boolean,
      ReadonlyArray<Message> | null,
      typeof CONFIG_DEFAULT | null,
      AbortController | null,
    ]
  > => {
    if (!isGenerating(convId)) {
      return [false, null, null, null];
    }
    const config: typeof CONFIG_DEFAULT = StorageUtils.getConfig();
    const currConversation = await StorageUtils.getOneConversation(convId);
    if (!currConversation) {
      throw new Error('Current conversation is not found');
    }
    const currMessages: ReadonlyArray<Message> =
      StorageUtils.filterByLeafNodeId(
        await StorageUtils.getMessages(convId),
        leafNodeId,
        false
      );
    const abortController = new AbortController();
    setAbort(convId, abortController);

    if (!currMessages) {
      throw new Error('Current messages are not found');
    }
    return [true, currMessages, config, abortController];
  };

  const generateMessagePrepareParams = (
    config: typeof CONFIG_DEFAULT,
    currMessages: ReadonlyArray<Message>
  ): APIMessage[] => {
    // prepare messages for API
    let messages: APIMessage[] = [
      ...(config.systemMessage.length === 0
        ? []
        : [{ role: 'system', content: config.systemMessage } as APIMessage]),
      ...normalizeMsgsForAPI(currMessages),
    ];
    if (config.excludeThoughtOnReq) {
      messages = filterThoughtFromMsgs(messages);
    }
    if (isDev) console.log({ messages });

    // prepare params
    return messages;
  };

  const generateMessageSendMessage = async (
    config: typeof CONFIG_DEFAULT,
    messages: APIMessage[],
    abortController: AbortController,
    pendingMsg: PendingMessage,
    convId: string,
    onChunk: CallbackGeneratedChunk
  ): Promise<void> => {
    const params = {
      messages,
      stream: true,
      cache_prompt: true,
      samplers: config.samplers,
      temperature: config.temperature,
      dynatemp_range: config.dynatemp_range,
      dynatemp_exponent: config.dynatemp_exponent,
      top_k: config.top_k,
      top_p: config.top_p,
      min_p: config.min_p,
      typical_p: config.typical_p,
      xtc_probability: config.xtc_probability,
      xtc_threshold: config.xtc_threshold,
      repeat_last_n: config.repeat_last_n,
      repeat_penalty: config.repeat_penalty,
      presence_penalty: config.presence_penalty,
      frequency_penalty: config.frequency_penalty,
      dry_multiplier: config.dry_multiplier,
      dry_base: config.dry_base,
      dry_allowed_length: config.dry_allowed_length,
      dry_penalty_last_n: config.dry_penalty_last_n,
      max_tokens: config.max_tokens,
      timings_per_token: config.showTokensPerSecond,
      ...(config.custom.length ? JSON.parse(config.custom) : {}),
    };
    // send request
    const fetchResponse = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify(params),
      signal: abortController.signal,
    });
    if (fetchResponse.status !== 200) {
      const body = await fetchResponse.json();
      throw new Error(body?.error?.message || 'Unknown error');
    }
    const chunks = getSSEStreamAsync(fetchResponse);
    for await (const chunk of chunks) {
      if (chunk.error) {
        throw new Error(chunk.error?.message || 'Unknown error');
      }
      const addedContent = chunk.choices[0].delta.content;
      const lastContent = pendingMsg.content ?? '';
      if (addedContent) {
        pendingMsg = {
          ...pendingMsg,
          content: lastContent + addedContent,
        };
      }
      const timings = chunk.timings;
      if (timings && config.showTokensPerSecond) {
        // only extract what's really needed, to save some space
        pendingMsg.timings = {
          prompt_n: timings.prompt_n,
          prompt_ms: timings.prompt_ms,
          predicted_n: timings.predicted_n,
          predicted_ms: timings.predicted_ms,
        };
      }
      setPending(convId, pendingMsg);
      onChunk(); // don't need to switch node for pending message
    }
  };
  const generateMessage = async (
    convId: string,
    leafNodeId: Message['id'],
    onChunk: CallbackGeneratedChunk
  ): Promise<void> => {
    const check = await generateMessageInitCheck(convId, leafNodeId);
    if (!check[0] || null == check[1] || null == check[2] || null == check[3]) {
      return;
    }
    const currMessages: ReadonlyArray<Message> = check[1];
    const config: typeof CONFIG_DEFAULT = check[2];
    const abortController = check[3];

    const pendingId = Date.now() + 1;
    const pendingMsg: PendingMessage = {
      id: pendingId,
      convId,
      type: 'text',
      timestamp: pendingId,
      role: 'assistant',
      content: null,
      parent: leafNodeId,
      children: [],
    };
    setPending(convId, pendingMsg);

    try {
      const messages: APIMessage[] = generateMessagePrepareParams(
        config,
        currMessages
      );
      await generateMessageSendMessage(
        config,
        messages,
        abortController,
        pendingMsg,
        convId,
        onChunk
      );
    } catch (err) {
      setPending(convId, null);
      if ((err as Error).name === 'AbortError') {
        // user stopped the generation via stopGeneration() function
        // we can safely ignore this error
      } else {
        console.error(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((err as any)?.message ?? 'Unknown error');
        throw err; // rethrow
      }
    }
    if (pendingMsg.content !== null) {
      await StorageUtils.appendMsg(pendingMsg as Message, leafNodeId);
    }
    setPending(convId, null);
    onChunk(pendingId); // trigger scroll to bottom and switch to the last node
  };

  const sendMessage = async (
    convId: string | null,
    leafNodeId: Message['id'] | null,
    content: string,
    extra: Message['extra'],
    onChunk: CallbackGeneratedChunk
  ): Promise<boolean> => {
    if (isGenerating(convId ?? '') || content.trim().length === 0) return false;

    if (convId === null || convId.length === 0 || leafNodeId === null) {
      const conv = await StorageUtils.createConversation(
        content.substring(0, 256)
      );
      convId = conv.id;
      leafNodeId = conv.currNode;
      // if user is creating a new conversation, redirect to the new conversation
      navigate(`/chat/${convId}`);
    }

    const now = Date.now();
    const currMsgId = now;
    await StorageUtils.appendMsg(
      {
        id: currMsgId,
        timestamp: now,
        type: 'text',
        convId,
        role: 'user',
        content,
        extra,
        parent: leafNodeId,
        children: [],
      },
      leafNodeId
    );
    onChunk(currMsgId);

    try {
      await generateMessage(convId, currMsgId, onChunk);
      return true;
      // eslint-disable-next-line sonarjs/no-ignored-exceptions,@typescript-eslint/no-unused-vars
    } catch (_) {
      // eslint-disable-next-line
      // TODO: rollback
    }
    return false;
  };

  const stopGenerating = (convId: string) => {
    setPending(convId, null);
    aborts[convId]?.abort();
  };

  // if content is undefined, we remove last assistant message
  const replaceMessageAndGenerate = async (
    convId: string,
    parentNodeId: Message['id'], // the parent node of the message to be replaced
    content: string | null,
    extra: Message['extra'],
    onChunk: CallbackGeneratedChunk
  ) => {
    if (isGenerating(convId)) return;

    if (content !== null) {
      const now = Date.now();
      const currMsgId = now;
      await StorageUtils.appendMsg(
        {
          id: currMsgId,
          timestamp: now,
          type: 'text',
          convId,
          role: 'user',
          content,
          extra,
          parent: parentNodeId,
          children: [],
        },
        parentNodeId
      );
      parentNodeId = currMsgId;
    }
    onChunk(parentNodeId);

    await generateMessage(convId, parentNodeId, onChunk);
  };

  const saveConfig = useCallback((config: typeof CONFIG_DEFAULT) => {
    StorageUtils.setConfig(config);
    setConfig(config);
  }, []);

  const closeDropDownMenu = (e: string) => {
    // if we specify the dropdown ID we can remove "open" attribute
    if (e !== '') {
      const elem = document.getElementById(e);
      if (elem) {
        elem.removeAttribute('open');
      }
    }
    // used for some dropdown menu, focus elsewhere
    document
      .getElementById('dropdown-close-helper')
      ?.focus({ preventScroll: true });
  };

  const languageOptions: languageOption[] = [
    { language: 'Chinese', code: 'cn' },
    { language: 'English', code: 'en' },
    { language: 'French', code: 'fr' },
    { language: 'German', code: 'de' },
    { language: 'Italian', code: 'it' },
    { language: 'Russian', code: 'ru' },
    { language: 'Spanish', code: 'es' },
  ];
  const [language, setLanguage] = useStateCallback(i18next.language);
  const [promptSelectOptions, setPromptSelectOptions] = useState<
    { key: number; value: string }[]
  >([]);
  const [promptSelectConfig, setPromptSelectConfig] = useStateCallback<
    typeof PROMPT_JSON | null
  >(null);
  const [promptSelectFirstConfig, setPromptSelectFirstConfig] =
    useState<number>(-1);

  useEffect(() => {
    if (!promptSelectConfig) {
      fetch('/prompts.config.json')
        .then((response) => {
          if (!response.ok) throw new Error(response.status.toString());
          else return response.json();
        })
        .then((data) => {
          if (data?.presets) {
            setPromptSelectConfig(data.presets);
          }
        })
        .catch((error) => {
          console.log('error: ' + error);
        });
    }
  }, [
    language,
    setPromptSelectConfig,
    setPromptSelectFirstConfig,
    setPromptSelectOptions,
    promptSelectConfig,
  ]);

  useEffect(() => {
    const prt: { key: number; value: string }[] = [];
    if (promptSelectConfig) {
      let firstConfigSet = false;
      saveConfig(CONFIG_DEFAULT);
      Object.keys(promptSelectConfig).forEach(function (key: string) {
        if (
          language == promptSelectConfig[parseInt(key)].lang ||
          promptSelectConfig[parseInt(key)].lang == ''
        ) {
          if (!firstConfigSet) {
            firstConfigSet = true;
            setPromptSelectFirstConfig(parseInt(key));
            saveConfig(promptSelectConfig[parseInt(key)].config);
          }
          const name = promptSelectConfig[parseInt(key)].name;
          prt.push({ key: parseInt(key), value: name });
        }
      });
      setPromptSelectConfig(promptSelectConfig, () => {
        resetSettings();
      });
    }
    setPromptSelectOptions(prt);
  }, [
    promptSelectConfig,
    language,
    resetSettings,
    setPromptSelectConfig,
    saveConfig,
  ]);

  const [selectedConfig, setSelectedConfig] = useState<number>(-1);

  useEffect(() => {
    if (
      promptSelectConfig !== null &&
      selectedConfig == -1 &&
      promptSelectFirstConfig != -1
    ) {
      setSelectedConfig(0);
      if (isDev)
        console.log(
          'Saving config',
          promptSelectConfig[promptSelectFirstConfig].config
        );
      saveConfig(CONFIG_DEFAULT);
      saveConfig(promptSelectConfig[promptSelectFirstConfig].config);
      resetSettings();
    }
  }, [
    promptSelectConfig,
    selectedConfig,
    saveConfig,
    resetSettings,
    promptSelectFirstConfig,
  ]);

  return (
    <AppContext.Provider
      // prettier-ignore
      value={{ //NOSONAR
        canvasData,
        closeDropDownMenu,
        config,
        isConfigOk,
        isGenerating,
        language,
        languageOptions,
        pendingMessages,
        promptSeed,
        promptSelectConfig,
        promptSelectFirstConfig,
        promptSelectOptions,
        replaceMessageAndGenerate,
        resetPromptSeed,
        resetSettings,
        saveConfig,
        sendMessage,
        setCanvasData,
        setLanguage,
        setPromptSelectConfig,
        setPromptSelectFirstConfig,
        setPromptSelectOptions,
        settingsSeed,
        stopGenerating,
        viewingChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
