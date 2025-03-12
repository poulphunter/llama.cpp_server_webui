import { useAppContext } from '../utils/app.context';
import { CONFIG_DEFAULT } from '../Config';
import StorageUtils from '../utils/storage';
import {
  BeakerIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  FunnelIcon,
  HandRaisedIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import { OpenInNewTab } from '../utils/common';
import { useTranslation } from 'react-i18next';
import { HeaderLanguageBlock, HeaderThemeBlock } from './Header.tsx';
import { BiXCircle } from 'react-icons/bi';
import Presets, {
  PresetsButtonResetConfig,
  PresetsButtonSave,
} from './Presets.tsx';

type SettKey = keyof typeof CONFIG_DEFAULT;

export default function SettingDialog() {
  const { t } = useTranslation();

  const BASIC_KEYS: SettKey[] = [
    'temperature',
    'top_k',
    'top_p',
    'min_p',
    'max_tokens',
  ];
  const SAMPLER_KEYS: SettKey[] = [
    'dynatemp_range',
    'dynatemp_exponent',
    'typical_p',
    'xtc_probability',
    'xtc_threshold',
  ];
  const PENALTY_KEYS: SettKey[] = [
    'repeat_last_n',
    'repeat_penalty',
    'presence_penalty',
    'frequency_penalty',
    'dry_multiplier',
    'dry_base',
    'dry_allowed_length',
    'dry_penalty_last_n',
  ];

  enum SettingInputType {
    SHORT_INPUT,
    LONG_INPUT,
    CHECKBOX,
    CUSTOM,
  }

  interface SettingFieldInput {
    type: Exclude<SettingInputType, SettingInputType.CUSTOM>;
    label: string | React.ReactElement;
    help?: string | React.ReactElement;
    key: SettKey;
  }

  interface SettingFieldCustom {
    type: SettingInputType.CUSTOM;
    key: SettKey;
    component:
      | string
      | React.FC<{
          value: string | boolean | number | never[] | string[];
          onChange: (value: string) => void;
        }>;
  }

  interface SettingSection {
    title: React.ReactElement;
    fields: (SettingFieldInput | SettingFieldCustom)[];
  }

  const ICON_CLASSNAME = 'w-6 h-6 mr-1 inline';

  const SETTING_SECTIONS: SettingSection[] = [
    {
      title: (
        <>
          <Cog6ToothIcon className={ICON_CLASSNAME} />
          {t('Settings.sections.General')}
        </>
      ),
      fields: [
        {
          type: SettingInputType.LONG_INPUT,
          label: t('Settings.labels.systemMessage'),
          key: 'systemMessage',
        },
        ...BASIC_KEYS.map(
          (key) =>
            ({
              type: SettingInputType.SHORT_INPUT,
              label: key,
              key,
            }) as SettingFieldInput
        ),
        {
          type: SettingInputType.SHORT_INPUT,
          label: t('Settings.labels.apiKey'),
          key: 'apiKey',
        },
      ],
    },
    {
      title: (
        <>
          <FunnelIcon className={ICON_CLASSNAME} />
          {t('Settings.sections.Samplers')}
        </>
      ),
      fields: [
        {
          type: SettingInputType.SHORT_INPUT,
          label: t('Settings.labels.samplers'),
          key: 'samplers',
        },
        ...SAMPLER_KEYS.map(
          (key) =>
            ({
              type: SettingInputType.SHORT_INPUT,
              label: key,
              key,
            }) as SettingFieldInput
        ),
      ],
    },
    {
      title: (
        <>
          <HandRaisedIcon className={ICON_CLASSNAME} />
          {t('Settings.sections.Penalties')}
        </>
      ),
      fields: PENALTY_KEYS.map((key) => ({
        type: SettingInputType.SHORT_INPUT,
        label: key,
        key,
      })),
    },
    {
      title: (
        <>
          <ChatBubbleOvalLeftEllipsisIcon className={ICON_CLASSNAME} />
          {t('Settings.sections.Reasoning')}
        </>
      ),
      fields: [
        {
          type: SettingInputType.CHECKBOX,
          label: t('Settings.labels.showThoughtInProgress'),
          key: 'showThoughtInProgress',
        },
        {
          type: SettingInputType.CHECKBOX,
          label: t('Settings.labels.excludeThoughtOnReq'),
          key: 'excludeThoughtOnReq',
        },
      ],
    },
    {
      title: (
        <>
          <SquaresPlusIcon className={ICON_CLASSNAME} />
          {t('Settings.sections.Advanced')}
        </>
      ),
      fields: [
        {
          type: SettingInputType.CUSTOM,
          key: 'custom', // dummy key, won't be used
          component: () => {
            const debugImportDemoConv = async () => {
              const res = await fetch('/demo-conversation.json');
              const demoConv = await res.json();
              await StorageUtils.remove(demoConv.id);
              for (const msg of demoConv.messages) {
                await StorageUtils.appendMsg(demoConv.id, msg);
              }
            };
            return (
              <button className="btn" onClick={debugImportDemoConv}>
                {t('Settings.labels.customBtn')}
              </button>
            );
          },
        },
        {
          type: SettingInputType.CHECKBOX,
          label: t('Settings.labels.showTokensPerSecond'),
          key: 'showTokensPerSecond',
        },
        {
          type: SettingInputType.LONG_INPUT,
          label: (
            <>
              {t('Settings.labels.custom')}{' '}
              <OpenInNewTab href="https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md">
                {t('Settings.labels.customLinkLabel')}
              </OpenInNewTab>
              ){' '}
            </>
          ),
          key: 'custom',
        },
      ],
    },
    {
      title: (
        <>
          <BeakerIcon className={ICON_CLASSNAME} />
          {t('Settings.sections.Experimental')}
        </>
      ),
      fields: [
        {
          type: SettingInputType.CUSTOM,
          key: 'custom', // dummy key, won't be used
          component: () => (
            <p className="mb-8">
              {t('Settings.labels.Experimental1')}
              <br />
              <br />
              {t('Settings.labels.Experimental2')}{' '}
              <OpenInNewTab href="https://github.com/ggerganov/llama.cpp/issues/new?template=019-bug-misc.yml">
                Bug (misc.)
              </OpenInNewTab>{' '}
              {t('Settings.labels.Experimental3')}
              <br />
              <br />
              {t('Settings.labels.Experimental4')}
            </p>
          ),
        },
        {
          type: SettingInputType.CHECKBOX,
          label: (
            <>
              <b>{t('Settings.labels.pyIntepreter1')}</b>
              <br />
              <small className="text-xs">
                {t('Settings.labels.pyIntepreter2')}{' '}
                <OpenInNewTab href="https://pyodide.org">pyodide</OpenInNewTab>,
                {t('Settings.labels.pyIntepreter3')}
              </small>
            </>
          ),
          key: 'pyIntepreterEnabled',
        },
      ],
    },
  ];

  const { localConfig, saveLocalConfig } = useAppContext();
  const onChange = (key: SettKey) => (value: string | boolean) => {
    // note: we do not perform validation here, because we may get incomplete value as user is still typing it
    saveLocalConfig({ ...localConfig, [key]: value });
  };

  const { settingsSeed } = useAppContext();

  return (
    <div
      key={settingsSeed}
      className="h-screen overflow-y-auto overflow-x-clip flex flex-col bg-base-200 py-4 px-4"
    >
      <div className="flex flex-row items-center justify-between mt-4 absolute top-0 right-0 z-50">
        <button
          className="tooltip tooltip-bottom z-100"
          data-tip={t('Settings.CloseBtn')}
          onClick={() => {
            const elem = document.getElementById('settingBlock');
            const elem2 = document.getElementById('mainBlock');
            if (elem && elem2) {
              elem.style.display = 'none';
              elem2.style.display = 'block';
            }
          }}
          onKeyDown={() => {
            const elem = document.getElementById('settingBlock');
            const elem2 = document.getElementById('mainBlock');
            if (elem && elem2) {
              elem.style.display = 'none';
              elem2.style.display = 'block';
            }
          }}
        >
          <div className="btn">
            <BiXCircle className="w-6 h-6" />
          </div>
        </button>
      </div>
      <div className="flex flex-row items-center justify-between mt-4 z-10">
        <h2 className="font-bold ml-4">{t('Settings.Settings')}</h2>
      </div>
      <div className="text-right block lg:hidden">
        <div className="">
          <HeaderThemeBlock id="theme-dropdown-2" />
          <HeaderLanguageBlock id="language-dropdown-2" />
        </div>
      </div>
      <div className="inline">
        <Presets />
      </div>
      <div className="flex flex-col">
        {/* Right panel, showing setting fields */}
        <div className="grow px-4">
          {SETTING_SECTIONS.map((section, idx) => (
            <div key={section.title.key + idx.toString()}>
              <div className="pt-3 pb-1">{section.title}</div>
              {section.fields.map((field, sIdx) => {
                const key = `${idx}-${sIdx}-${field.key}-${section.title.key}`;
                if (field.type === SettingInputType.SHORT_INPUT) {
                  return (
                    <SettingsModalShortInput
                      key={key}
                      configKey={field.key}
                      value={localConfig[field.key]}
                      onChange={onChange(field.key)}
                      label={field.label as string}
                    />
                  );
                } else if (field.type === SettingInputType.LONG_INPUT) {
                  return (
                    <SettingsModalLongInput
                      key={key}
                      configKey={field.key}
                      value={localConfig[field.key].toString()}
                      onChange={onChange(field.key)}
                      label={field.label as string}
                    />
                  );
                } else if (field.type === SettingInputType.CHECKBOX) {
                  return (
                    <SettingsModalCheckbox
                      key={key}
                      configKey={field.key}
                      value={!!localConfig[field.key]}
                      onChange={onChange(field.key)}
                      label={field.label as string}
                    />
                  );
                } else if (field.type === SettingInputType.CUSTOM) {
                  return (
                    <div key={key} className="mb-2">
                      {typeof field.component === 'string'
                        ? field.component
                        : field.component({
                            value: localConfig[field.key],
                            onChange: onChange(field.key),
                          })}
                    </div>
                  );
                }
              })}
            </div>
          ))}
          <p className="opacity-40 mb-6 text-sm mt-8">
            {t('Settings.savedLocal')}
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between mt-4 sticky bottom-0 z-10">
        <PresetsButtonResetConfig />
        <PresetsButtonSave />
      </div>
    </div>
  );
}

function SettingsModalLongInput({
  configKey,
  value,
  onChange,
  label,
}: Readonly<{
  configKey: SettKey;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}>) {
  return (
    <label className="form-control mb-2">
      <div className="label inline">{label ?? configKey}</div>
      <textarea
        className="textarea textarea-bordered h-24"
        placeholder={`Default: ${CONFIG_DEFAULT[configKey] || 'none'}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SettingsModalShortInput({
  configKey,
  value,
  onChange,
  label,
}: Readonly<{
  configKey: SettKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  onChange: (value: string) => void;
  label?: string;
}>) {
  const { t } = useTranslation();
  const transHelpMsg = t('Settings.meaning.' + configKey);
  return (
    <>
      {/* on mobile, we simply show the help message here */}
      {transHelpMsg && (
        <div className="block md:hidden mb-1">
          <b>{label ?? configKey}</b>
          <br />
          <p className="text-xs">{transHelpMsg}</p>
        </div>
      )}
      <label className="input input-bordered join-item grow flex items-center gap-2 mb-2">
        <div className="dropdown dropdown-hover">
          <button className="font-bold hidden md:block">
            {label ?? configKey}
          </button>
          {transHelpMsg && (
            <div className="dropdown-content menu bg-base-100 rounded-box z-10 w-64 p-2 shadow mt-4">
              {transHelpMsg}
            </div>
          )}
        </div>
        <input
          type="text"
          className="grow"
          placeholder={`Default: ${CONFIG_DEFAULT[configKey] || 'none'}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </>
  );
}

function SettingsModalCheckbox({
  configKey,
  value,
  onChange,
  label,
}: Readonly<{
  configKey: SettKey;
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}>) {
  return (
    <div className="flex flex-row items-center mb-2">
      <input
        type="checkbox"
        className="toggle"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ml-4">{label || configKey}</span>
    </div>
  );
}
