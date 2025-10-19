import { useEffect, useState } from 'react';
import StorageUtils from '../utils/storage';
import { useAppContext } from '../utils/app.context';
import { classNames } from '../utils/misc';
import daisyuiThemes from 'daisyui/src/theming/themes';
import { THEMES } from '../Config';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { ConversationListButton } from './ConversationList.tsx';
import { IoLanguage, IoSettingsOutline } from 'react-icons/io5';
import { BiPalette } from 'react-icons/bi';

export function HeaderThemeBlock({ id }: Readonly<{ id: string }>) {
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState(StorageUtils.getTheme());
  const setTheme = (theme: string) => {
    StorageUtils.setTheme(theme);
    setSelectedTheme(theme);
  };
  useEffect(() => {
    document.body.setAttribute('data-theme', selectedTheme);
    document.body.setAttribute(
      'data-color-scheme',
      // @ts-expect-error daisyuiThemes complains about index type, but it should work
      daisyuiThemes[selectedTheme]?.['color-scheme'] ?? 'auto'
    );
  }, [selectedTheme]);
  /* theme controller is copied from https://daisyui.com/components/theme-controller/ */
  return (
    <div
      className="tooltip tooltip-bottom z-100"
      aria-label={t('Header.tooltipTheme')}
      data-tip={t('Header.tooltipTheme')}
    >
      <div id={id} className="dropdown dropdown-end dropdown-bottom">
        <button tabIndex={0} className="btn m-1">
          <BiPalette className="w-6 h-6" />
        </button>
        <ul className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto">
          <li>
            <button
              className={classNames({
                'btn btn-sm btn-block btn-ghost justify-start': true,
                'btn-active': selectedTheme === 'auto',
              })}
              onClick={() => setTheme('auto')}
            >
              auto
            </button>
          </li>
          {THEMES.map((theme) => (
            <li key={theme}>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                aria-label={theme}
                value={theme}
                checked={selectedTheme === theme}
                onChange={(e) => e.target.checked && setTheme(theme)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function HeaderLanguageBlock({ id }: Readonly<{ id: string }>) {
  const { t } = useTranslation();
  const { closeDropDownMenu, languageOptions, setLanguage } = useAppContext();
  /* theme controller is copied from https://daisyui.com/components/theme-controller/ */
  return (
    <div
      className="tooltip tooltip-bottom z-100"
      aria-label={t('Header.tooltipLanguage')}
      data-tip={t('Header.tooltipLanguage')}
    >
      <div id={id} className="dropdown dropdown-end dropdown-bottom">
        <button tabIndex={0} className="btn m-1">
          <IoLanguage className="w-6 h-6" />
        </button>
        <ul className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto">
          {languageOptions.map(({ language, code }, key) => (
            <li key={code + key.toString()}>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                aria-label={language}
                value={language}
                onChange={() => {
                  setLanguage(code);
                  i18next.changeLanguage(code).then(() => {});
                }}
                onClick={() => {
                  closeDropDownMenu(id);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Header() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.body.dir = i18n.dir();
  }, [i18n, i18n.language]);

  return (
    <div className="flex flex-row items-center pt-6 pb-6 sticky top-0 z-10 bg-base-100">
      <ConversationListButton />
      <div className="grow text-2xl font-bold ml-2 text-center">llama.cpp</div>
      {/* action buttons (top right) */}
      <div className="flex items-center">
        <button
          className="hidden xl:block tooltip tooltip-bottom z-100"
          aria-label={t('Header.tooltipSettings')}
          data-tip={t('Header.tooltipSettings')}
          onClick={() => {
            const elem = document.getElementById('settingBlock');
            if (elem) {
              elem.style.display = 'block';
            }
          }}
        >
          <div className="btn m-1">
            {/* settings button */}
            <IoSettingsOutline className="w-6 h-6" />
          </div>
        </button>
        <button
          className="xl:hidden tooltip tooltip-bottom z-100"
          aria-label={t('Header.tooltipSettings')}
          data-tip={t('Header.tooltipSettings')}
          onClick={() => {
            const elem = document.getElementById('settingBlock');
            const elem2 = document.getElementById('mainBlock');
            if (elem && elem2) {
              elem.style.display = 'block';
              elem2.style.display = 'none';
            }
          }}
        >
          <div className="btn m-1">
            <IoSettingsOutline className="w-6 h-6" />
          </div>
        </button>
        <div className="hidden lg:block">
          <HeaderThemeBlock id="theme-dropdown-1" />
          <HeaderLanguageBlock id="language-dropdown-1" />
        </div>
      </div>
    </div>
  );
}
