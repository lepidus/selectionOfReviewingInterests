<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use PKP\plugins\Hook;

/**
 * ReviewerSelectionExtension.php
 * 
 * Handles extension of the reviewer selection form to include interests filter
 */
class ReviewerSelectionExtension
{
    private SelectionOfReviewingInterestsPlugin $plugin;
    private InterestFilterHelper $interestFilterHelper;

    public function __construct(SelectionOfReviewingInterestsPlugin $plugin)
    {
        $this->plugin = $plugin;
        $this->interestFilterHelper = new InterestFilterHelper($plugin);
    }

    /**
     * Register hooks for reviewer selection extension
     */
    public function registerHooks(): void
    {
        // Hook to extend the SelectReviewerListPanel getConfig method
        // This hook is custom and needs to be implemented in the plugin
        Hook::add(
            'PKPSelectReviewerListPanel::getConfig',
            [$this, 'extendListPanelConfig']
        );
    }

    /**
     * Hook: PKPSelectReviewerListPanel::getConfig
     * Extend the list panel configuration to include interests filter
     *
     * @param string $hookName Hook name
     * @param array $params [0] = &$config, [1] = $listPanel
     * @return bool False to allow other hooks to continue
     */
    public function extendListPanelConfig(string $hookName, array $params): bool
    {
        $config = &$params[0];
        $listPanel = $params[1];

        // Get the context from the list panel or request
        $context = \APP\core\Application::get()->getRequest()->getContext();
        if (!$context) {
            return false;
        }

        $contextId = $context->getId();

        // Get filter configuration from helper
        $filterConfig = $this->interestFilterHelper->buildFilterConfig($contextId);

        if ($filterConfig === null) {
            return false;
        }

        // Inject filter into the config filters array
        if (!isset($config['filters'])) {
            $config['filters'] = [];
        }

        $config['filters'][] = $filterConfig;

        return false;
    }
}
