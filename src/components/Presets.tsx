//return type for restpresets.com api.
//do this for the static type checking. very important!
import { useEffect, useState } from 'react';
import Autocomplete from '../utils/Autocomplete.tsx';
import { useAppContext } from '../utils/app.context.tsx';
import { CONFIG_DEFAULT, isDev, PROMPT_JSON } from '../Config.ts';
import { BiDownload, BiReset, BiSave, BiSliderAlt, BiX } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

export const PresetsButtonSave = () => {
  const { t } = useTranslation();
  const { localConfig, saveConfig, isConfigOk } = useAppContext();
  const {
    promptSelectConfig,
    language,
    setPromptSelectConfig,
    saveLocalConfig,
    presetAutocompleteValue,
  } = useAppContext();

  const saveNewPreset = (newConfig: typeof CONFIG_DEFAULT) => {
    // If preset input not empty we must save the preset too.
    if (presetAutocompleteValue.length > 0) {
      const newName: string = presetAutocompleteValue;
      if (isDev) {
        console.log(newName);
      }
      let newPromptSelectConfig: typeof PROMPT_JSON | null = JSON.parse(
        JSON.stringify(promptSelectConfig)
      );
      if (!promptSelectConfig) {
        newPromptSelectConfig = [];
      }
      let configFound = -1;
      if (newPromptSelectConfig) {
        Object.keys(newPromptSelectConfig).forEach(function (key: string) {
          if (
            (language == newPromptSelectConfig[parseInt(key)].lang ||
              newPromptSelectConfig[parseInt(key)].lang == '') &&
            newPromptSelectConfig[parseInt(key)].name === newName
          ) {
            configFound = parseInt(key);
            newPromptSelectConfig[parseInt(key)].config = newConfig;
            console.log('config found');
            console.log(newPromptSelectConfig[parseInt(key)]);
          }
        });
        if (configFound === -1) {
          console.log('new config');
          newPromptSelectConfig.push({
            name: newName,
            lang: language,
            config: newConfig,
          });
          configFound = newPromptSelectConfig.length - 1;
          console.log(newPromptSelectConfig[configFound]);
        }
      }

      console.log('newPromptSelectConfig');
      console.log(newPromptSelectConfig);
      setPromptSelectConfig(newPromptSelectConfig, () => {
        if (configFound !== -1 && newPromptSelectConfig) {
          saveLocalConfig(newPromptSelectConfig[configFound].config);
          saveConfig(newPromptSelectConfig[configFound].config);
          console.log('config');
          console.log(newPromptSelectConfig[configFound].config);
        }
      });
    }
  };
  const handleSave = () => {
    // copy the local config to prevent direct mutation
    const newConfig: typeof CONFIG_DEFAULT = JSON.parse(
      JSON.stringify(localConfig)
    );
    const isOk: string | typeof CONFIG_DEFAULT = isConfigOk(newConfig);
    if (typeof isOk === 'string') {
      if (isDev) {
        console.log(isOk);
      }
      alert(isOk);
      return;
    }
    if (isDev) console.log('Saving config', isOk);
    saveNewPreset(isOk);
    saveLocalConfig(isOk);
    saveConfig(isOk);
  };

  return (
    <button
      className="tooltip tooltip-top z-100"
      aria-label={t('Settings.saveBtn')}
      data-tip={t('Settings.saveBtn')}
      onClick={() => {
        handleSave();
      }}
      onKeyDown={() => {
        handleSave();
      }}
    >
      <div className="btn btn-primary">
        <BiSave className="h-6 w-6" />
      </div>
    </button>
  );
};

export const PresetsButtonResetConfig = () => {
  const { t } = useTranslation();
  const { saveLocalConfig } = useAppContext();
  const resetConfig = () => {
    if (window.confirm(t('Settings.resetConfirm'))) {
      saveLocalConfig(CONFIG_DEFAULT);
    }
  };

  return (
    <button
      className="tooltip tooltip-top z-100"
      aria-label={t('Settings.resetBtn')}
      data-tip={t('Settings.resetBtn')}
      onClick={() => {
        resetConfig();
      }}
      onKeyDown={() => {
        resetConfig();
      }}
    >
      <div className="btn">
        <BiReset className="w-6 h-6" />
      </div>
    </button>
  );
};

export const Presets = () => {
  const { t } = useTranslation();
  const { language, presetAutocompleteValue, setPresetAutocompleteValue } =
    useAppContext();
  const deletePresets = () => {
    if (window.confirm(t('Settings.deletePresetBtnConfirm'))) {
      const newPromptSelectConfig: typeof PROMPT_JSON = [];
      if (promptSelectConfig) {
        Object.keys(promptSelectConfig).forEach(function (key: string) {
          if (
            language == promptSelectConfig[parseInt(key)].lang &&
            promptSelectConfig[parseInt(key)].name === presetAutocompleteValue
          ) {
            console.log('config found');
            console.log(newPromptSelectConfig[parseInt(key)]);
          } else {
            newPromptSelectConfig.push(promptSelectConfig[parseInt(key)]);
          }
        });
      }
      setPromptSelectConfig(newPromptSelectConfig, () => {
        setPresetAutocompleteValue('');
        resetSettings();
      });
    }
  };
  const downloadPresets = () => {
    const configJson = JSON.stringify({ presets: promptSelectConfig }, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { setPromptSelectConfig, promptSelectConfig, resetSettings } =
    useAppContext();

  const onFileChange = () => {
    const inputE: HTMLInputElement = document?.getElementById(
      'configJsonInput'
    ) as HTMLInputElement;
    let files: FileList | null = null;
    if (inputE?.files) {
      files = inputE.files;
    } else {
      return;
    }
    if (files.length <= 0) {
      return false;
    }
    const fr = new FileReader();
    fr.onload = function (e) {
      const result = JSON.parse(e?.target?.result as string);
      if (result?.presets) {
        setPromptSelectConfig(result.presets, () => {
          resetSettings();
        });
      }
      console.log('JSON loaded !');
      resetSettings();
    };
    const fItem: Blob | null = files.item(0);
    if (fItem) {
      fr.readAsText(fItem);
    }
  };
  return (
    <>
      <div className="px-4 mt-4 flex">
        <BiSliderAlt className="h-6 w-6" />
        <div>{t('Settings.presetLabel')}</div>
      </div>
      <div className="block sm:flex justify-end">
        <button
          className="tooltip tooltip-bottom z-100"
          aria-label={t('Settings.deletePresetBtn')}
          data-tip={t('Settings.deletePresetBtn')}
          onClick={deletePresets}
          onKeyDown={deletePresets}
        >
          <div className="dropdown dropdown-end dropdown-bottom">
            <div className="btn m-1">
              <BiX className="h-6 w-6" />
            </div>
          </div>
        </button>
        <button
          className="tooltip tooltip-bottom z-100"
          aria-label={t('Settings.loadPresetBtn')}
          data-tip={t('Settings.loadPresetBtn')}
          onClick={() => {
            document?.getElementById('configJsonInput')?.click();
          }}
          onKeyDown={() => {
            document?.getElementById('configJsonInput')?.click();
          }}
        >
          <input
            id="configJsonInput"
            className="hidden"
            type="file"
            onChange={() => {
              onFileChange();
            }}
            accept=".json"
          />
          <div className="dropdown dropdown-end dropdown-bottom">
            <div className="btn m-1">
              <BiDownload className="h-6 w-6" />
            </div>
          </div>
        </button>
        <button
          className="tooltip tooltip-bottom z-100"
          aria-label={t('Settings.savePresetBtn')}
          data-tip={t('Settings.savePresetBtn')}
          onClick={downloadPresets}
          onKeyDown={downloadPresets}
        >
          <div className="dropdown dropdown-end dropdown-bottom">
            <div className="btn m-1">
              <BiSave className="h-6 w-6" />
            </div>
          </div>
        </button>
        <div className="">
          <PresetsAutoComplete />
        </div>
      </div>
    </>
  );
};
const PresetsAutoComplete = () => {
  const {
    promptSelectOptions,
    saveConfig,
    promptSelectConfig,
    isConfigOk,
    setPresetAutocompleteValue,
    presetAutocompleteValue,
  } = useAppContext();

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
    if (!presetAutocompleteValue) {
      setItems(presets);
      return;
    }
    //if the val changes, we filter items so that it can be filtered. and set it as new state
    const newItems = presets
      .filter((p) =>
        p.toLowerCase().includes(presetAutocompleteValue.toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b));
    setItems(newItems);
  }, [presets, presetAutocompleteValue]);

  const selectPrompt = (value: number): void => {
    if (promptSelectConfig?.[value]?.config) {
      // validate the config
      const isCfOk = isConfigOk(promptSelectConfig?.[value]?.config);
      if (typeof isCfOk === 'string') {
        if (isDev) {
          console.log(isCfOk);
        }
        return;
      }
      if (isDev) {
        console.log('Saving config', isCfOk);
      }
      saveConfig(isCfOk);
    }
  };

  //use the common auto complete component here.
  return (
    <Autocomplete
      items={items}
      value={presetAutocompleteValue}
      onChange={(val) => {
        setPresetAutocompleteValue(val);
      }}
      onSetItem={(val) => {
        setPresetAutocompleteValue(val);
        promptSelectOptions.forEach((opt) => {
          if (opt.value === val) {
            selectPrompt(opt.key);
          }
        });
      }}
    />
  );
};
export default Presets;
