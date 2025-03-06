//return type for restpresets.com api.
//do this for the static type checking. very important!
import { useEffect, useState } from 'react';
import Autocomplete from '../utils/Autocomplete.tsx';
import { useAppContext } from '../utils/app.context.tsx';
import { CONFIG_DEFAULT, isDev } from '../Config.ts';

const PresetsAutocomplete = () => {
  const {
    promptSelectOptions,
    saveConfig,
    resetSettings,
    promptSelectConfig,
    isConfigOk,
  } = useAppContext();

  //query typed by user
  const [val, setVal] = useState('');

  //a list to hold all the presets
  const [presets, setPresets] = useState<string[]>([]);

  //a list to show on the dropdown when user types
  const [items, setItems] = useState<string[]>([]);

  //query rest presets api and set the presets list
  useEffect(() => {
    async function fetchData() {
      const itms = promptSelectOptions
        .map((p) => p.value)
        .sort((a, b) => a.localeCompare(b));
      setPresets(itms);
    }

    fetchData().then(() => {});
  }, [promptSelectOptions]);

  useEffect(() => {
    //if there is no value, return the presets list.
    if (!val) {
      setItems(presets);
      return;
    }
    //if the val changes, we filter items so that it can be filtered. and set it as new state
    const newItems = presets
      .filter((p) => p.toLowerCase().includes(val.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
    setItems(newItems);
  }, [presets, val]);

  const isSelectPromptOk = (value: number): boolean => {
    if (value === -1) {
      resetSettings();
      return false;
    }
    return !!promptSelectConfig?.[value]?.config;
  };

  const selectPrompt = (value: number): void => {
    if (isSelectPromptOk(value)) {
      const conf: typeof CONFIG_DEFAULT = CONFIG_DEFAULT;
      const prtConf: typeof CONFIG_DEFAULT | undefined =
        promptSelectConfig?.[value]?.config;
      if (typeof prtConf == typeof CONFIG_DEFAULT) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        Object.keys(prtConf).forEach(function (key) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          conf[key] = prtConf[key];
        });
      }
      // validate the config
      const isCfOk = isConfigOk(conf);
      if (isCfOk !== '') {
        if (isDev) {
          console.log(isCfOk);
        }
        return;
      }
      if (isDev) {
        console.log('Saving config', conf);
      }
      saveConfig(CONFIG_DEFAULT);
      saveConfig(conf);
      resetSettings();
    }
  };

  //use the common auto complete component here.
  return (
    <Autocomplete
      items={items}
      value={val}
      onChange={(val) => {
        setVal(val);
        promptSelectOptions.forEach((opt) => {
          if (opt.value === val) {
            selectPrompt(opt.key);
          }
        });
      }}
    />
  );
};
export default PresetsAutocomplete;
