//return type for restpresets.com api.
//do this for the static type checking. very important!
import { useEffect, useState } from 'react';
import Autocomplete from '../utils/Autocomplete.tsx';
import { useAppContext } from '../utils/app.context.tsx';
import { CONFIG_DEFAULT, isDev } from '../Config.ts';
import { isBoolean, isNumeric, isString } from '../utils/misc.ts';
import { useTranslation } from 'react-i18next';

const PresetsAutocomplete = () => {
  const { t } = useTranslation();
  const { promptSelectOptions, saveConfig, resetSettings, promptSelectConfig } =
    useAppContext();

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

  const isSelectPromptOk=(value:number): boolean=> {
    if (value === -1) {
      resetSettings();
      return false;
    }
    return !!promptSelectConfig?.[value]?.config;
  }

  const isConfigOk=(conf:typeof CONFIG_DEFAULT): string => {
    for (const key in conf) {
      const val =
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
      if (mustBeString) {
        if (!isString(val)) {
          return t('Settings.labels.handleSave1')+' '+key+' '+t('Settings.labels.handleSave2');
        }
      } else if (mustBeNumeric) {
        const trimmedValue = val.toString().trim();
        const numVal = Number(trimmedValue);
        if (
          isNaN(numVal) ||
          !isNumeric(numVal) ||
          trimmedValue.length === 0
        ) {
          return t('Settings.labels.handleSave1')+' '+key+' '+t('Settings.labels.handleSave3');
        }
        // force conversion to number
        // @ts-expect-error this is safe
        newConfig[key] = numVal;
      } else if (mustBeBoolean) {
        if (!isBoolean(val)) {
          return t('Settings.labels.handleSave1')+' '+key+' '+t('Settings.labels.handleSave4');
        }
      } else if (mustBeArray) {
        if (!Array.isArray(val)) {
          return t('Settings.labels.handleSave1')+' '+key+' '+t('Settings.labels.handleSave5');
        }
      } else {
        return `Unknown default type for key ${key}`;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      newConfig[key] = val
    }
    return '';
  }

  const selectPrompt = (value: number): void => {
    if (isSelectPromptOk(value)) {
      const newConfig: typeof CONFIG_DEFAULT = JSON.parse(
        JSON.stringify(CONFIG_DEFAULT)
      );
      const conf=promptSelectConfig?.[value]?.config || CONFIG_DEFAULT;
      // validate the config
      const isCfOk=isConfigOk(conf);
      if (isCfOk!=='')
      {
        if (isDev) {
          console.log(isCfOk);
        }
        return;
      }
      if (isDev) {
        console.log('Saving config', newConfig);
      }
      saveConfig(CONFIG_DEFAULT);
      saveConfig(newConfig);
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
