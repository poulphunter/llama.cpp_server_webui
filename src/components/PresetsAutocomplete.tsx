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

  const selectPrompt = (value: number): void => {
    if (value === -1) {
      resetSettings();
      return;
    }
    if (promptSelectConfig?.[value]?.config) {
      const newConfig: typeof CONFIG_DEFAULT = JSON.parse(
        JSON.stringify(CONFIG_DEFAULT)
      );
      // validate the config
      for (const key in promptSelectConfig[value].config) {
        const val =
          promptSelectConfig[value].config[key as keyof typeof CONFIG_DEFAULT];
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
            console.log(
              `${t('Settings.labels.handleSave1')} ${key} ${t('Settings.labels.handleSave2')}`
            );
            console.log(value);
            return;
          }
        } else if (mustBeNumeric) {
          const trimmedValue = val.toString().trim();
          const numVal = Number(trimmedValue);
          if (
            isNaN(numVal) ||
            !isNumeric(numVal) ||
            trimmedValue.length === 0
          ) {
            console.log(
              `${t('Settings.labels.handleSave1')} ${key} ${t('Settings.labels.handleSave3')}`
            );
            console.log(value);
            return;
          }
          // force conversion to number
          // @ts-expect-error this is safe
          newConfig[key] = numVal;
        } else if (mustBeBoolean) {
          if (!isBoolean(val)) {
            console.log(
              `${t('Settings.labels.handleSave1')} ${key} ${t('Settings.labels.handleSave4')}`
            );
            console.log(value);
            return;
          }
        } else if (mustBeArray) {
          if (!Array.isArray(val)) {
            console.log(
              `${t('Settings.labels.handleSave1')} ${key} ${t('Settings.labels.handleSave5')}`
            );
            console.log(val);
            return;
          }
        } else {
          console.error(`Unknown default type for key ${key}`);
          console.log(value);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        newConfig[key] = val;
      }
      if (isDev) console.log('Saving config', newConfig);
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
