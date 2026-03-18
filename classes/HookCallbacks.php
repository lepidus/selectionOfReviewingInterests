<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

use APP\core\Application;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use APP\template\TemplateManager;
use Illuminate\Database\Query\Builder;
use PKP\security\Role;

class HookCallbacks
{
    private SelectionOfReviewingInterestsPlugin $plugin;
    private ?\Closure $messageFilterCallback = null;
    private ?\Closure $registrationFilterCallback = null;

    public function __construct(SelectionOfReviewingInterestsPlugin $plugin)
    {
        $this->plugin = $plugin;
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
        } elseif (!empty($templateMgr->getState('menu'))) {
            if ($this->userShouldBeRedirected($request)) {
                $request->redirect(null, 'user', 'profile');
            }
            $this->registerFilterSelectComponent($templateMgr, $context->getId());
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

    public function addInterestFilterToReviewerPanel(string $hookName, array $params): bool
    {
        $templateMgr = $params[0];
        $template = $params[1];

        if ($template !== 'controllers/grid/users/reviewer/form/advancedSearchReviewerForm.tpl') {
            return false;
        }

        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $options = $this->plugin->getSetting($context->getId(), 'interestOptions') ?: [];
        $optionsArray = array_values($options);

        if (empty($optionsArray)) {
            return false;
        }

        $interestFilter = [
            'param' => 'interestOption',
            'title' => __('plugins.generic.selectionOfReviewingInterests.reviewer.filter.label'),
            'filterType' => 'filter-select',
            'value' => '',
            'options' => array_merge(
                [['value' => '', 'label' => __('plugins.generic.selectionOfReviewingInterests.reviewer.filter.all')]],
                array_map(fn ($opt) => ['value' => $opt, 'label' => $opt], $optionsArray)
            ),
        ];

        $selectReviewerListData = $templateMgr->getTemplateVars('selectReviewerListData');

        if ($selectReviewerListData
            && isset($selectReviewerListData['components']['selectReviewer']['filters'])) {
            $selectReviewerListData['components']['selectReviewer']['filters'][] = $interestFilter;
            $templateMgr->assign('selectReviewerListData', $selectReviewerListData);
        }

        return false;
    }

    public function addInterestFilterParam(string $hookName, array $params): bool
    {
        $requestParams = &$params[0];
        $request = $params[1];

        $interestOption = $request->query('interestOption');
        if ($interestOption !== null) {
            $requestParams['interestOption'] = $interestOption;
        }

        return false;
    }

    public function filterReviewersByInterest(string $hookName, array $params): bool
    {
        $query = $params[0];
        $collector = $params[1];

        $request = Application::get()->getRequest();
        $interestOption = $request->getQueryArray()['interestOption'] ?? null;

        if ($interestOption === null || $interestOption === '') {
            return false;
        }

        $query->whereExists(
            fn (Builder $q) => $q->from('user_interests', 'ui_filter')
                ->join('controlled_vocab_entry_settings AS cves_filter', 'ui_filter.controlled_vocab_entry_id', '=', 'cves_filter.controlled_vocab_entry_id')
                ->whereColumn('ui_filter.user_id', '=', 'u.user_id')
                ->whereRaw('LOWER(cves_filter.setting_value) = LOWER(?)', [$interestOption])
        );

        return false;
    }

    private function registerFilterSelectComponent(TemplateManager $templateMgr, int $contextId): void
    {
        $request = Application::get()->getRequest();
        $scriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/FilterSelect.js';

        $templateMgr->addJavaScript(
            'soriFilterSelect',
            $scriptUrl,
            [
                'contexts' => 'backend',
                'priority' => TemplateManager::STYLE_SEQUENCE_LATE,
            ]
        );
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
}
