'use client';

import { useState, useRef, useCallback } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useOptionalMobileBottom } from '../../contexts/MobileBottomContext';
import { useComposerTabs } from './useComposerTabs';
import { useComposerActions } from './useComposerActions';
import { useTextareaScroll } from './useTextareaScroll';
import ComposerTextarea from './ComposerTextarea';
import ComposerFooter from './ComposerFooter';
import ComposerToolbar from './ComposerToolbar';
import ComposerErrorBanner from './ComposerErrorBanner';
import ReplySuggestions from '../typing/ReplySuggestions';
import ActionPromptBanner from '../typing/ActionPromptBanner';
import TabBar from '../typing-tabs/TabBar';
import MobileTabList from '../typing-tabs/MobileTabList';
import TabManagementDialog from '../typing-tabs/TabManagementDialog';
import LiveTypingBottomSheet from '../live-typing/LiveTypingBottomSheet';
import LiveTypingLinkModal from '../live-typing/LiveTypingLinkModal';
import type { ComposerProps } from './types';

export default function Composer({
  text,
  onChange,
  onSpeak,
  onSpeakWithTone,
  onMessageCompleted,
  onStop,
  isSpeaking = false,
  isAvailable = true,
  className = '',
  enableTabs = false,
  enableLiveTyping = false,
  enableFixText = false,
  enableToneControl = false,
  onAddAsPhrase,
  replySuggestions,
}: ComposerProps) {
  const [showTabList, setShowTabList] = useState(false);
  const [showTabManagement, setShowTabManagement] = useState(false);
  const [showLiveTypingSheet, setShowLiveTypingSheet] = useState(false);
  const [showLiveTypingModal, setShowLiveTypingModal] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const mobileBottom = useOptionalMobileBottom();
  const shouldPortalToolbar = isMobile && !!mobileBottom?.dockContainer;

  // Tab management
  const {
    currentText,
    handleTextChange: tabHandleTextChange,
    tabs,
    activeTabId,
    createTab,
    switchTab,
    closeTab,
    closeAllTabs,
    renameTab,
    updateActiveTabText,
  } = useComposerTabs(text, onChange, enableTabs);

  // Textarea scroll management
  const { captureSnapshot, captureScrollIntent, scrollToEnd } = useTextareaScroll(inputRef, currentText);

  // Actions (clear, speak, fix text, enter handling, live typing, errors)
  const actions = useComposerActions({
    currentText,
    activeTabId,
    enableTabs,
    onChange,
    updateActiveTabText,
    switchTab,
    onSpeak,
    onSpeakWithTone,
    onMessageCompleted,
    inputRef,
    enableLiveTyping,
  });

  // Wrap text change to include scroll intent capture and undo reset
  const handleTextChange = useCallback((value: string) => {
    captureScrollIntent(value);
    if (actions.canUndo && value.trim().length > 0) actions.resetUndo();
    if (actions.error) actions.setError(null);
    tabHandleTextChange(value);
  }, [captureScrollIntent, actions, tabHandleTextChange]);

  // Tab selection with scroll-to-end
  const handleTabSelect = useCallback((tabId: string) => {
    switchTab(tabId);
    scrollToEnd();
  }, [switchTab, scrollToEnd]);

  // Live typing button active state includes dialog visibility
  const isLiveTypingButtonActive = actions.isLiveTypingSharing || showLiveTypingModal || showLiveTypingSheet;

  const handleShare = useCallback(() => {
    if (!actions.isOnline) {
      actions.setError('Live Typing is unavailable offline.');
      return;
    }
    if (isMobile) {
      setShowLiveTypingSheet(true);
    } else {
      setShowLiveTypingModal(true);
    }
  }, [actions, isMobile]);

  // Footer content — same tree regardless of portal mode
  const footerContent = (
    <>
      {replySuggestions && (
        <div className={shouldPortalToolbar ? 'px-4 pt-2' : 'px-4 pb-2'}>
          <ReplySuggestions
            history={replySuggestions.history}
            enabled={replySuggestions.enabled}
            onSelectSuggestion={replySuggestions.onSelect}
            variant="inline"
          />
        </div>
      )}
      {shouldPortalToolbar ? (
        // Mobile portal: banner OR toolbar, never both — keeps bottom stack stable
        (actions.showUndoHint || actions.showDoubleEnterHint || actions.error) ? (
          <div className="px-4 pt-2 pb-2">
            {actions.error ? (
              <span className="text-sm text-red-400">{actions.error}</span>
            ) : actions.showUndoHint ? (
              <ActionPromptBanner variant="undo" remainingMs={actions.undoRemainingMs} onUndo={actions.undo} />
            ) : (
              <ActionPromptBanner variant="doubleEnter" actionLabel={actions.doubleEnterActionLabel} remainingMs={actions.doubleEnterRemainingMs} />
            )}
          </div>
        ) : (
          <ComposerToolbar
            currentText={currentText}
            onClear={actions.handleClear}
            onSpeak={() => onSpeak('speak')}
            onStop={onStop}
            onToneSelected={actions.handleToneSelected}
            isSpeaking={isSpeaking}
            isAvailable={isAvailable}
            enableFixText={enableFixText}
            isOnline={actions.isOnline}
            isFixingText={actions.isFixingText}
            onFixText={actions.handleFixText}
            enableLiveTyping={enableLiveTyping}
            isLiveTypingButtonActive={isLiveTypingButtonActive}
            onShare={handleShare}
            hasUser={!!actions.user}
            onAddAsPhrase={onAddAsPhrase}
            enableToneControl={enableToneControl}
            isPortaled={true}
          />
        )
      ) : (
        // Desktop/offline: banners and toolbar can stack
        <>
          {(actions.showUndoHint || actions.showDoubleEnterHint) && (
            <div className="px-4 pb-2">
              {actions.showUndoHint ? (
                <ActionPromptBanner variant="undo" remainingMs={actions.undoRemainingMs} onUndo={actions.undo} />
              ) : (
                <ActionPromptBanner variant="doubleEnter" actionLabel={actions.doubleEnterActionLabel} remainingMs={actions.doubleEnterRemainingMs} />
              )}
            </div>
          )}
          {actions.error && (
            <ComposerErrorBanner error={actions.error} />
          )}
          <ComposerToolbar
            currentText={currentText}
            onClear={actions.handleClear}
            onSpeak={() => onSpeak('speak')}
            onStop={onStop}
            onToneSelected={actions.handleToneSelected}
            isSpeaking={isSpeaking}
            isAvailable={isAvailable}
            enableFixText={enableFixText}
            isOnline={actions.isOnline}
            isFixingText={actions.isFixingText}
            onFixText={actions.handleFixText}
            enableLiveTyping={enableLiveTyping}
            isLiveTypingButtonActive={isLiveTypingButtonActive}
            onShare={handleShare}
            hasUser={!!actions.user}
            onAddAsPhrase={onAddAsPhrase}
            enableToneControl={enableToneControl}
            isPortaled={false}
          />
        </>
      )}
    </>
  );

  return (
    <>
      <div className={`flex flex-col flex-1 min-h-0 h-full overflow-hidden ${className}`}>
        {/* Tab bar */}
        {enableTabs && (
          <div className="sticky top-0 z-10 shrink-0">
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={handleTabSelect}
              onTabClose={closeTab}
              onTabCreate={createTab}
              onTabRename={renameTab}
              onManage={() => isMobile ? setShowTabList(true) : setShowTabManagement(true)}
            />
          </div>
        )}

        {/* Textarea */}
        <ComposerTextarea
          currentText={currentText}
          onTextChange={handleTextChange}
          onKeyDown={actions.handleKeyDown}
          textSizePx={settings.textSize}
          textareaRef={inputRef}
          onSelect={() => captureSnapshot()}
          onClick={() => captureSnapshot()}
          onKeyUp={() => captureSnapshot()}
          onBlur={() => captureSnapshot()}
        />

        {/* Footer: suggestions, banners, toolbar */}
        <ComposerFooter shouldPortal={shouldPortalToolbar}>
          {footerContent}
        </ComposerFooter>
      </div>

      {/* Tab management dialogs */}
      {enableTabs && (
        <MobileTabList
          isOpen={showTabList}
          onClose={() => setShowTabList(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={(tabId) => { handleTabSelect(tabId); const tab = tabs.find(t => t.id === tabId); if (tab) onChange(tab.text); }}
          onCloseTab={(tabId) => { closeTab(tabId); const remaining = tabs.filter(t => t.id !== tabId); if (remaining.length > 0) onChange(remaining[0].text); }}
          onCloseAllTabs={() => { closeAllTabs(); onChange(''); }}
          onCreateTab={() => { createTab(); onChange(''); }}
          onRenameTab={renameTab}
        />
      )}
      {enableTabs && (
        <TabManagementDialog
          isOpen={showTabManagement}
          onClose={() => setShowTabManagement(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onCloseAllTabs={() => { closeAllTabs(); onChange(''); }}
          onRenameTab={renameTab}
        />
      )}

      {/* Live typing dialogs */}
      {enableLiveTyping && actions.user && (
        <>
          <LiveTypingBottomSheet
            isOpen={showLiveTypingSheet}
            onClose={() => setShowLiveTypingSheet(false)}
            isSharing={actions.isLiveTypingSharing}
            isCreating={actions.isLiveTypingCreating}
            shareableLink={actions.shareableLink}
            onStartSharing={actions.handleStartLiveTyping}
            onEndSession={async () => { await actions.endLiveTypingSession(); }}
          />
          {showLiveTypingModal && !isMobile && (
            <LiveTypingLinkModal
              shareableLink={actions.shareableLink}
              isCreating={actions.isLiveTypingCreating}
              onStartSharing={actions.handleStartLiveTyping}
              onClose={() => setShowLiveTypingModal(false)}
              onEndSession={async () => {
                await actions.endLiveTypingSession();
                setShowLiveTypingModal(false);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
