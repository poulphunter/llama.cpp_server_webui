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

export function HeaderThemeBlock({ id }: { id: string }) {
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
  {
    /* theme controller is copied from https://daisyui.com/components/theme-controller/ */
  }
  return (
    <div
      className="tooltip tooltip-bottom z-100"
      data-tip={t('Header.tooltipTheme')}
    >
      <div id={id} className="dropdown dropdown-end dropdown-bottom">
        <div tabIndex={0} role="button" className="btn m-1">
          <BiPalette className="w-6 h-6" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto"
        >
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

export function HeaderLanguageBlock({ id }: { id: string }) {
  const { t } = useTranslation();
  const { closeDropDownMenu, languageOptions, setLanguage } = useAppContext();
  {
    /* theme controller is copied from https://daisyui.com/components/theme-controller/ */
  }
  return (
    <div
      className="tooltip tooltip-bottom z-100"
      data-tip={t('Header.tooltipLanguage')}
    >
      <div id={id} className="dropdown dropdown-end dropdown-bottom">
        <div tabIndex={0} role="button" className="btn m-1">
          <IoLanguage className="w-6 h-6" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto"
        >
          {languageOptions.map(({ language, code }, key) => (
            <li key={key}>
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
        <div
          className="hidden xl:block tooltip tooltip-bottom z-100"
          data-tip={t('Header.tooltipSettings')}
          onClick={() => {
            const elem = document.getElementById('settingBlock');
            if (elem) {
              elem.style.display = 'block';
            }
          }}
        >
          <button className="btn m-1">
            {/* settings button */}
            <IoSettingsOutline className="w-6 h-6" />
          </button>
        </div>
        <div
          className="xl:hidden tooltip tooltip-bottom z-100"
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
          <button className="btn m-1">
            {/* settings button */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-gear"
              viewBox="0 0 16 16"
            >
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
            </svg>
          </button>
        </div>
        <div className="hidden lg:block">
          <HeaderThemeBlock id="theme-dropdown-1" />
          <HeaderLanguageBlock id="language-dropdown-1" />
        </div>
      </div>
    </div>
  );
}
