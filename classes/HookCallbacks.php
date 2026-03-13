<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

use APP\core\Application;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use APP\template\TemplateManager;
use PKP\security\Role;
use PKP\db\DAORegistry;

class HookCallbacks
{
    private SelectionOfReviewingInterestsPlugin $plugin;
    private ?\Closure $messageFilterCallback = null;
    private ?\Closure $registrationFilterCallback = null;
    private ?InterestFilterHelper $interestFilterHelper = null;
    private ?array $currentInterestEntryIds = null;

    public function __construct(SelectionOfReviewingInterestsPlugin $plugin)
    {
        $this->plugin = $plugin;
        $this->interestFilterHelper = new InterestFilterHelper($plugin);
    }

    public function addChangesOnTemplateDisplaying(string $hookName, array $params): bool
    {
        $templateMgr = $params[0];
        $template = $params[1];
        $request = Application::get()->getRequest();
        $context = $request->getContext();

        if (!$context) {
            return false;
        }

        if ($template === 'user/profile.tpl') {
            $this->addInterestsScripts($templateMgr, $context->getId());

            if ($this->userShouldBeRedirected($request)) {
                $this->addRedirectMessageFilter($templateMgr);
            }
        } elseif ($template === 'frontend/pages/userRegister.tpl') {
            $this->addRegistrationFilter($templateMgr);
        } elseif ($template === 'controllers/grid/users/reviewer/form/advancedSearchReviewerForm.tpl') {
            // Inject interests filter into reviewer selection modal
            $this->addInterestFilterToReviewerSelection($templateMgr, $context->getId());
        } elseif (!empty($templateMgr->getState('menu')) && $this->userShouldBeRedirected($request)) {
            $request->redirect(null, 'user', 'profile');
        }

        return false;
    }

    public function redirectUserAfterLogin(string $hookName, array $params): bool
    {
        $url = &$params[0];
        if (strpos($url, '/dashboard') === false) {
            return false;
        }

        $request = Application::get()->getRequest();
        if ($this->userShouldBeRedirected($request)) {
            $url = $request->getDispatcher()->url($request, Application::ROUTE_PAGE, null, 'user', 'profile');
        }

        return false;
    }

    public function userShouldBeRedirected($request): bool
    {
        $context = $request->getContext();
        $user = $request->getUser();
        $userRoles = $user ? $user->getRoles($context->getId()) : [];
        $userRoles = array_map(function ($role) {
            return $role->getId();
        }, $userRoles);

        if (is_null($user) || !in_array(Role::ROLE_ID_REVIEWER, $userRoles)) {
            return false;
        }

        return empty($user->getInterestString());
    }

    public function requestMessageFilter($output, $templateMgr)
    {
        $profileTabsPattern = '/<div[^>]+id="profileTabs"/';
        if (preg_match($profileTabsPattern, $output, $matches, PREG_OFFSET_CAPTURE)) {
            $offset = $matches[0][1];

            $newOutput = substr($output, 0, $offset);
            $newOutput .= $templateMgr->fetch($this->plugin->getTemplateResource('emptyInterestsMessage.tpl'));
            $newOutput .= substr($output, $offset);

            $output = $newOutput;

            if ($this->messageFilterCallback) {
                $templateMgr->unregisterFilter('output', $this->messageFilterCallback);
            }
        }

        return $output;
    }

    public function registrationInterestsFilter($output, $templateMgr)
    {
        $pattern = '/<div\s+id="reviewerInterests"[^>]*>.*?<\/div>/s';

        if (preg_match($pattern, $output)) {
            $output = preg_replace($pattern, '', $output);

            if ($this->registrationFilterCallback) {
                $templateMgr->unregisterFilter('output', $this->registrationFilterCallback);
            }
        }

        return $output;
    }

    private function addInterestsScripts(TemplateManager $templateMgr, int $contextId): void
    {
        $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: [];
        $optionsArray = array_values($options);

        $inlineScript = '$.pkp.plugins.generic = $.pkp.plugins.generic || {};';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests = ';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests || {};';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests.interestsOptions = ';
        $inlineScript .= json_encode($optionsArray) . ';';

        $templateMgr->addJavaScript(
            'interestsOptions',
            $inlineScript,
            [
                'inline' => true,
                'contexts' => 'backend',
            ]
        );

        $request = Application::get()->getRequest();
        $patchScriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/interestsTagitPatch.js';

        $templateMgr->addJavaScript(
            'interestsTagitPatch',
            $patchScriptUrl,
            [
                'contexts' => 'backend',
                'priority' => TemplateManager::STYLE_SEQUENCE_LATE,
            ]
        );
    }

    private function addRedirectMessageFilter(TemplateManager $templateMgr): void
    {
        $this->messageFilterCallback = $this->requestMessageFilter(...);
        $templateMgr->registerFilter('output', $this->messageFilterCallback);
    }

    private function addRegistrationFilter(TemplateManager $templateMgr): void
    {
        $this->registrationFilterCallback = $this->registrationInterestsFilter(...);
        $templateMgr->registerFilter('output', $this->registrationFilterCallback);
    }

    /**
     * Hook: API::users::reviewers::params
     * Extend API parameters to accept and validate interestEntryIds parameter
     * 
     * @param string $hookName Hook name
     * @param array $params [0] = &$params (allowed parameters), [1] = $request
     * @return bool False to allow other hooks to continue
     */
    public function addInterestFilterToReviewersAPI(string $hookName, array $params): bool
    {
        $paramsArray = &$params[0];
        $request = $params[1];

        // Get the interestEntryIds parameter from query
        $interestIds = $request->query('interestEntryIds');

        if ($interestIds) {
            // Parse and validate the IDs
            $validatedIds = $this->interestFilterHelper->parseInterestIdsFromRequest($interestIds);

            if (!empty($validatedIds)) {
                // Store for later use in the Collector hook
                $this->currentInterestEntryIds = $validatedIds;
                
                // Add to allowed parameters so it doesn't get filtered out
                $paramsArray['interestEntryIds'] = $validatedIds;
            }
        }

        return false;
    }

    /**
     * Hook: User::Collector
     * Apply interest filtering to the user collector query
     * Called when the Collector is building its query
     * 
     * @param string $hookName Hook name
     * @param array $params [0] = &$queryBuilder, [1] = $userCollector
     * @return bool False to allow other hooks to continue
     */
    public function applyInterestFilterToUserCollector(string $hookName, array $params): bool
    {
        $queryBuilder = &$params[0];
        
        // Use the stored interest entry IDs from the API hook
        if (empty($this->currentInterestEntryIds)) {
            return false;
        }

        $interestEntryIds = $this->currentInterestEntryIds;

        // Apply the filter using subquery to user_interests table
        // This filters users who have ANY of the selected interests (OR logic)
        $queryBuilder->whereExists(
            function ($query) use ($interestEntryIds) {
                $query->select(\Illuminate\Support\Facades\DB::raw(1))
                    ->from('user_interests', 'ui')
                    ->whereColumn('ui.user_id', '=', 'u.user_id')
                    ->whereIn('ui.controlled_vocab_entry_id', $interestEntryIds);
            }
        );

        // Clear after use to avoid applying to subsequent requests
        $this->currentInterestEntryIds = null;

        return false;
    }

    /**
     * Add interest filter to the reviewer selection form/modal
     * Injects JavaScript to enhance the SelectReviewerListPanel with interests filter
     * 
     * @param TemplateManager $templateMgr Template manager instance
     * @param int $contextId Journal/Press context ID
     */
    private function addInterestFilterToReviewerSelection(TemplateManager $templateMgr, int $contextId): void
    {
        $interests = $this->interestFilterHelper->getConfiguredInterests($contextId);

        if (empty($interests)) {
            return;
        }

        // Get mapping of interest names to controlled vocab IDs
        $entryIds = $this->interestFilterHelper->getInterestControlledVocabIds($contextId);

        // Build the interests array for JavaScript
        $interestOptions = [];
        foreach ($interests as $id => $name) {
            // Use the controlled vocab entry ID if available, otherwise use plugin ID
            $key = $entryIds[$id] ?? $id;
            $interestOptions[$key] = $name;
        }

        // Inject interests data as JavaScript variable
        $inlineScript = '$.pkp.plugins.generic = $.pkp.plugins.generic || {};';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests = ';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests || {};';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests.reviewingInterestOptions = ';
        $inlineScript .= json_encode($interestOptions) . ';';

        $templateMgr->addJavaScript(
            'reviewingInterestOptions',
            $inlineScript,
            [
                'inline' => true,
                'contexts' => 'backend',
            ]
        );

        // Inject the JavaScript that handles the filter
        $request = Application::get()->getRequest();
        $scriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/reviewerSelectionInterestFilter.js';

        $templateMgr->addJavaScript(
            'reviewerSelectionInterestFilter',
            $scriptUrl,
            [
                'contexts' => 'backend',
                'priority' => TemplateManager::STYLE_SEQUENCE_LATE,
            ]
        );
    }
}
