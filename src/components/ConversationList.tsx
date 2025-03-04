import { useEffect, useState } from 'react';
import { classNames } from '../utils/misc';
import { Conversation } from '../utils/types';
import StorageUtils from '../utils/storage';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../utils/app.context.tsx';
import {
  BiAddToQueue,
  BiChat,
  BiDownload,
  BiReset,
  BiSave,
  BiX,
  BiXCircle,
} from 'react-icons/bi';

export function ConversationListDownloadDeleteButtonHeader({
  classAdd,
}: {
  classAdd: string;
}) {
  const { t } = useTranslation();
  const { isGenerating, viewingChat } = useAppContext();
  const isCurrConvGenerating = isGenerating(viewingChat?.conv.id ?? '');
  const navigate = useNavigate();

  const removeConversation = () => {
    if (isCurrConvGenerating || !viewingChat) return;
    const convId = viewingChat?.conv.id;
    if (window.confirm(t('ConversationList.deleteConfirm'))) {
      StorageUtils.remove(convId).then(() => {});
      navigate('/');
    }
  };

  return (
    <>
      {viewingChat && (
        <>
          <div
            className={classAdd + ' tooltip tooltip-bottom z-100'}
            data-tip={t('ConversationList.deleteBtn')}
            onClick={removeConversation}
          >
            <button
              role="button"
              className="btn m-1"
              disabled={isCurrConvGenerating}
              aria-label={t('ConversationList.deleteBtn')}
            >
              <BiX className="h-6 w-6" />
            </button>
          </div>
          <div
            className={classAdd + ' tooltip tooltip-bottom z-100'}
            data-tip={t('ConversationList.newConversation')}
            onClick={() => {
              navigate('/');
              const elem = document.getElementById(
                'toggle-conversation-list'
              ) as HTMLInputElement;
              if (elem && elem.checked) {
                elem.click();
              }
            }}
          >
            <button
              role="button"
              className={classNames({
                'btn m-1 ml-4': true,
              })}
              aria-label={t('ConversationList.newConversation')}
            >
              <BiAddToQueue className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function ConversationListButton() {
  const { t } = useTranslation();
  return (
    <>
      {/* open sidebar button */}
      <div
        className="tooltip tooltip-bottom z-100"
        data-tip={t('ConversationList.conversationBtn')}
        onClick={() => {
          const elem = document.getElementById('convBlock');
          if (elem) {
            elem.style.display = 'block';
          }
        }}
      >
        <label htmlFor="toggle-conversation-list" className="btn m-1 lg:hidden">
          <BiChat className="w-6 h-6" />
        </label>
      </div>
      <ConversationListDownloadDeleteButtonHeader classAdd="hidden sm:block lg:hidden" />
    </>
  );
}

export default function ConversationList() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currConv, setCurrConv] = useState<Conversation | null>(null);

  useEffect(() => {
    StorageUtils.getOneConversation(params.convId ?? '').then(setCurrConv);
  }, [params.convId]);

  useEffect(() => {
    const handleConversationChange = async () => {
      setConversations(await StorageUtils.getAllConversations());
    };
    StorageUtils.onConversationChanged(handleConversationChange);
    handleConversationChange().then(() => {});
    return () => {
      StorageUtils.offConversationChanged(handleConversationChange);
    };
  }, []);

  const clearConversations = () => {
    if (window.confirm(t('ConversationList.deletesConfirm'))) {
      StorageUtils.clearConversations().then(() => navigate('/'));
    }
  };

  const getConversations = () => {
    StorageUtils.getConversations((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const onConvInputChange = () => {
    const handleConversationChange = async () => {
      setConversations(await StorageUtils.getAllConversations());
    };
    const inputE: HTMLInputElement = document?.getElementById(
      'configConvInput'
    ) as HTMLInputElement;
    let files: FileList | null = null;
    if (inputE && inputE.files) {
      files = inputE.files;
    } else {
      return;
    }
    if (files.length <= 0) {
      return false;
    }
    const fr = new FileReader();
    fr.onload = function (e) {
      if (!e) return;
      if (!e.target) return;
      const blob: Blob = new Blob([e.target.result as BlobPart], {
        type: 'text/json',
      });
      StorageUtils.clearConversations().then(() => {
        // eslint-disable-next-line sonarjs/no-nested-functions
        StorageUtils.setConversations(blob, () => {
          console.log('Database loaded !');
          navigate('/');
          handleConversationChange().then(() => {});
        });
      });
    };
    const fItem: Blob | null = files.item(0);
    if (fItem) {
      fr.readAsArrayBuffer(fItem);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col max-w-64 py-4 px-4">
        <div className="flex flex-row items-center justify-between mb-2 mt-4">
          <h2 className="font-bold ml-4">
            {t('ConversationList.Conversations')}
          </h2>
          {/* close sidebar button */}

          <div
            className="tooltip tooltip-bottom z-100"
            data-tip={t('ConversationList.closeBtn')}
            onClick={() => {
              const elem = document.getElementById('convBlock');
              if (elem) {
                if (elem.style.display === 'none') {
                  elem.style.display = 'block';
                } else {
                  elem.style.display = 'none';
                }
              }
            }}
          >
            <label className="btn btn-ghost m-1 lg:hidden">
              <BiXCircle className="w-6 h-6" />
            </label>
          </div>
        </div>

        <div className="w-full block">
          <div className="flex flex-col items-center">
            <span>
              <div
                className="tooltip tooltip-bottom z-100"
                data-tip={t('ConversationList.resetConversationBtn')}
                onClick={() => {
                  clearConversations();
                }}
              >
                <button className="btn m-1">
                  <BiReset className="w-6 h-6" />
                </button>
              </div>
              <div
                className="tooltip tooltip-bottom z-100"
                data-tip={t('ConversationList.loadConversationBtn')}
                onClick={() => {
                  document?.getElementById('configConvInput')?.click();
                }}
              >
                <input
                  id="configConvInput"
                  className="hidden"
                  type="file"
                  onChange={() => {
                    onConvInputChange();
                  }}
                  accept=".json"
                />
                <button className="btn m-1">
                  <BiDownload className="h-6 w-6" />
                </button>
              </div>
              <div
                className="tooltip tooltip-bottom z-100"
                data-tip={t('ConversationList.saveConversationBtn')}
                onClick={() => {
                  getConversations();
                }}
              >
                <div className="dropdown dropdown-end dropdown-bottom">
                  <div tabIndex={0} role="button" className="btn m-1">
                    <BiSave className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </span>
          </div>
        </div>

        <div className="w-full sm:hidden lg:block">
          <div className="flex flex-col items-center">
            <span>
              <ConversationListDownloadDeleteButtonHeader classAdd="" />
            </span>
          </div>
        </div>
        {/* list of conversations */}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={classNames({
              'btn btn-ghost justify-start font-normal': true,
              'btn-active': conv.id === currConv?.id,
            })}
            onClick={() => {
              navigate(`/chat/${conv.id}`);
              const elem = document.getElementById(
                'toggle-conversation-list'
              ) as HTMLInputElement;
              if (elem && elem.checked) {
                elem.click();
              }
            }}
            dir="auto"
          >
            <span className="truncate">{conv.name}</span>
          </div>
        ))}

        <div className="text-center text-xs opacity-40 mt-auto mx-4">
          {t('ConversationList.convInformation')}
        </div>
      </div>
    </>
  );
}
