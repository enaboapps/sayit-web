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
import ComposerSidebar from './ComposerSidebar';
import SuggestionsPopover from './SuggestionsPopover';
import ComposerErrorBanner from './ComposerErrorBanner';
import ActionPromptBanner from '../typing/ActionPromptBanner';
import TabBar from '../typing-tabs/TabBar';
import MobileTabList from '../typing-tabs/MobileTabList';
import TabManagementDialog from '../typing-tabs/TabManagementDialog';
import LiveTypingBottomSheet from '../live-typing/LiveTypingBottomSheet';
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
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const mobileBottom = useOptionalMobileBottom();
  const shouldPortalBanners = isMobile && !!mobileBottom?.dockContainer;

  // Suggestions state — count tracked via callback from ReplySuggestions
  const [suggestionsCount, setSuggestionsCount] = useState(0);

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

  // Live typing button active state includes sheet visibility
  const isLiveTypingButtonActive = actions.isLiveTypingSharing || showLiveTypingSheet;

  const handleShare = useCallback(() => {
    if (!actions.isOnline) {
      actions.setError('Live Typing is unavailable offline.');
      return;
    }
    setShowLiveTypingSheet(true);
  }, [actions]);

  // Banner content — portaled on mobile, inline on desktop
  const bannerContent = (
    <>
      {(actions.showUndoHint || actions.showDoubleEnterHint) && (
        <div className="px-4 py-2">
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

        {/* Main body: textarea + sidebar */}
        <div className="flex flex-1 min-h-0">
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

          {/* Sidebar with suggestions popover anchor */}
          <div className="relative shrink-0">
            <ComposerSidebar
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
              suggestionsCount={suggestionsCount}
              onSuggestionsOpen={() => setShowSuggestions(true)}
              suggestionsEnabled={!!replySuggestions && !!actions.user && actions.isOnline}
            />
            {replySuggestions && (
              <SuggestionsPopover
                isOpen={showSuggestions}
                onClose={() => setShowSuggestions(false)}
                history={replySuggestions.history}
                enabled={replySuggestions.enabled}
                onSelectSuggestion={(s) => { replySuggestions.onSelect(s); setShowSuggestions(false); }}
                onCountChange={setSuggestionsCount}
              />
            )}
          </div>
        </div>

        {/* Banners only */}
        <ComposerFooter shouldPortal={shouldPortalBanners}>
          {bannerContent}
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

      {/* Live typing share sheet */}
      {enableLiveTyping && actions.user && (
        <LiveTypingBottomSheet
          isOpen={showLiveTypingSheet}
          onClose={() => setShowLiveTypingSheet(false)}
          isSharing={actions.isLiveTypingSharing}
          isCreating={actions.isLiveTypingCreating}
          shareableLink={actions.shareableLink}
          onStartSharing={actions.handleStartLiveTyping}
          onEndSession={async () => { await actions.endLiveTypingSession(); }}
        />
      )}
    </>
  );
}
