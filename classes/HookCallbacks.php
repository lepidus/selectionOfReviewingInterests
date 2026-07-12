<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

use APP\core\Application;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use APP\template\TemplateManager;
use Illuminate\Database\Query\Builder;
use PKP\security\Role;
use PKP\user\InterestManager;
use PKP\user\User;

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

    public function addInterestsScriptsOnUserDetailsFormDisplay(string $hookName, array $params): bool
    {
        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $templateMgr = TemplateManager::getManager($request);
        $templateMgr->registerFilter(
            'output',
            [$this, 'userDetailsInterestsAssetsFilter']
        );

        return false;
    }

    public function validateRegistrationInterests(string $hookName, array $params): bool
    {
        $this->validateSubmittedInterests($params[0], null);
        return false;
    }

    public function validateProfileInterests(string $hookName, array $params): bool
    {
        $form = $params[0];
        $this->validateSubmittedInterests($form, $form->getUser());
        return false;
    }

    public function validateUserDetailsInterests(string $hookName, array $params): bool
    {
        $form = $params[0];
        $this->validateSubmittedInterests($form, $form->user ?? null);
        return false;
    }

    public function userDetailsInterestsAssetsFilter($output, $templateMgr)
    {
        if (strpos($output, 'id="userDetailsForm"') === false
                || strpos($output, 'class="interests"') === false) {
            return $output;
        }

        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return $output;
        }

        $templateMgr->unregisterFilter('output', [$this, 'userDetailsInterestsAssetsFilter']);

        return $output . $this->getInterestsAssetsMarkup($context->getId());
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
            'filterType' => 'filter-checkboxes',
            'value' => [],
            'options' => array_map(fn ($opt) => ['value' => $opt, 'label' => $opt], $optionsArray),
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

        $interestOption = $request->getQueryParam('interestOption');
        if ($interestOption !== null) {
            $requestParams['interestOption'] = (array) $interestOption;
        }

        return false;
    }

    public function filterReviewersByInterest(string $hookName, array $params): bool
    {
        $query = $params[0];
        $collector = $params[1];

        $request = Application::get()->getRequest();
        $interestOption = $request->getQueryArray()['interestOption'] ?? null;

        if ($interestOption === null || $interestOption === '' || $interestOption === []) {
            return false;
        }

        $interests = array_filter((array) $interestOption);
        if (empty($interests)) {
            return false;
        }

        $query->whereExists(
            fn (Builder $q) => $q->from('user_interests', 'ui_filter')
                ->join('controlled_vocab_entry_settings AS cves_filter', 'ui_filter.controlled_vocab_entry_id', '=', 'cves_filter.controlled_vocab_entry_id')
                ->whereColumn('ui_filter.user_id', '=', 'u.user_id')
                ->whereIn('cves_filter.setting_value', $interests)
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
        $templateMgr->addJavaScript(
            'interestsOptions',
            $this->getInterestsOptionsInlineScript($contextId),
            [
                'inline' => true,
                'contexts' => 'backend',
            ]
        );

        $request = Application::get()->getRequest();
        $patchScriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/interestsTagitPatch.js';
        $patchStyleUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/styles/interestsTagitPatch.css';

        $templateMgr->addJavaScript(
            'interestsTagitPatch',
            $patchScriptUrl,
            [
                'contexts' => 'backend',
                'priority' => TemplateManager::STYLE_SEQUENCE_LATE,
            ]
        );

        $templateMgr->addStyleSheet(
            'interestsTagitPatch',
            $patchStyleUrl,
            [
                'contexts' => 'backend',
                'priority' => TemplateManager::STYLE_SEQUENCE_LATE,
            ]
        );
    }

    private function getInterestsOptionsInlineScript(int $contextId): string
    {
        $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: [];
        $optionsArray = array_values($options);
        $placeholderText = __('plugins.generic.selectionOfReviewingInterests.profilePage.placeholder');

        $inlineScript = '$.pkp.plugins.generic = $.pkp.plugins.generic || {};';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests = ';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests || {};';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests.interestsOptions = ';
        $inlineScript .= json_encode($optionsArray) . ';';
        $inlineScript .= '$.pkp.plugins.generic.selectionOfReviewingInterests.placeholder = ';
        $inlineScript .= json_encode($placeholderText) . ';';

        return $inlineScript;
    }

    private function getInterestsAssetsMarkup(int $contextId): string
    {
        $request = Application::get()->getRequest();
        $patchScriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/interestsTagitPatch.js';
        $patchStyleUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/styles/interestsTagitPatch.css';

        return '<script type="text/javascript">'
            . $this->getInterestsOptionsInlineScript($contextId)
            . '</script>'
            . '<link rel="stylesheet" type="text/css" href="' . htmlspecialchars($patchStyleUrl, ENT_QUOTES, 'UTF-8') . '" />'
            . '<script type="text/javascript" src="' . htmlspecialchars($patchScriptUrl, ENT_QUOTES, 'UTF-8') . '"></script>';
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

    private function validateSubmittedInterests($form, ?User $user): void
    {
        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return;
        }

        $configuredOptions = $this->plugin->getSetting($context->getId(), 'interestOptions') ?: [];
        if (!is_array($configuredOptions)) {
            return;
        }

        $allowedInterests = $this->normalizeInterests(array_values($configuredOptions));
        if (empty($allowedInterests)) {
            return;
        }

        $submittedInterests = $this->normalizeInterests($form->getData('interests'), $hasInvalidValue);
        $existingInterests = [];
        if ($user && $user->getId()) {
            $existingInterests = (new InterestManager())->getInterestsForUser($user);
        }

        $acceptedInterests = array_merge($allowedInterests, $existingInterests);
        foreach ($submittedInterests as $interest) {
            if (!in_array($interest, $acceptedInterests, true)) {
                $hasInvalidValue = true;
                break;
            }
        }

        if ($hasInvalidValue) {
            $form->addError(
                'interests',
                __('plugins.generic.selectionOfReviewingInterests.profilePage.invalidInterest')
            );
        }
    }

    private function normalizeInterests($interests, ?bool &$hasInvalidValue = null): array
    {
        $hasInvalidValue = false;
        if ($interests === null || $interests === '') {
            return [];
        }

        if (!is_array($interests)) {
            if (!is_string($interests)) {
                $hasInvalidValue = true;
                return [];
            }
            $interests = explode(',', $interests);
        }

        $normalizedInterests = [];
        foreach ($interests as $interest) {
            if (!is_string($interest)) {
                $hasInvalidValue = true;
                continue;
            }

            $interest = trim($interest);
            if ($interest !== '') {
                $normalizedInterests[] = $interest;
            }
        }

        return array_values(array_unique($normalizedInterests));
    }
}
