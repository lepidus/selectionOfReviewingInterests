<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

use APP\core\Application;
use APP\facades\Repo;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use APP\template\TemplateManager;
use Illuminate\Database\Query\Builder;
use PKP\controllers\grid\settings\user\form\UserDetailsForm;
use PKP\form\Form;
use PKP\security\Role;
use PKP\user\form\RolesForm;
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

    public function validateSubmittedInterests(string $hookName, array $params): bool
    {
        $form = $params[0];
        if (!$form instanceof Form) {
            return false;
        }

        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $configuredInterests = $this->normalizeInterests(
            $this->plugin->getSetting($context->getId(), 'interestOptions') ?: []
        );
        if ($configuredInterests === []) {
            return false;
        }

        $submittedInterests = $this->normalizeInterests($form->getData('interests'));
        if ($submittedInterests === null) {
            $form->addError(
                'interests',
                __('plugins.generic.selectionOfReviewingInterests.profilePage.invalidInterest')
            );
            return false;
        }

        $form->setData('interests', $submittedInterests);

        $existingInterests = [];
        $targetUser = $this->getTargetUser($form);
        if ($targetUser) {
            $existingInterests = $this->normalizeInterests(
                Repo::userInterest()->getInterestsForUser($targetUser)
            ) ?? [];
        }

        $allowedInterests = array_unique(array_merge($configuredInterests, $existingInterests));
        if (array_diff($submittedInterests, $allowedInterests) !== []) {
            $form->addError(
                'interests',
                __('plugins.generic.selectionOfReviewingInterests.profilePage.invalidInterest')
            );
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

    public function addInterestsPatchToUserDetailsForm(string $hookName, array $params): bool
    {
        $smarty = $params[1];
        $output = &$params[2];

        if ($smarty->getTemplateVars('disableInterestsSection')) {
            return false;
        }

        $request = Application::get()->getRequest();
        $context = $request->getContext();

        if (!$context) {
            return false;
        }

        $output = $this->getInterestsPatchInlineMarkup($context->getId());

        return false;
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

        $interestOption = $request->query('interestOption');
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
            $this->getInterestsOptionsScript($contextId),
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

    private function getInterestsOptionsScript(int $contextId): string
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

    private function getInterestsPatchInlineMarkup(int $contextId): string
    {
        $patchScriptPath = BASE_SYS_DIR . '/' . $this->plugin->getPluginPath() . '/js/interestsTagitPatch.js';
        $patchStylePath = BASE_SYS_DIR . '/' . $this->plugin->getPluginPath() . '/styles/interestsTagitPatch.css';
        $patchScript = is_readable($patchScriptPath) ? file_get_contents($patchScriptPath) : '';
        $patchStyle = is_readable($patchStylePath) ? file_get_contents($patchStylePath) : '';

        $markup = '<script type="text/javascript">' . $this->getInterestsOptionsScript($contextId) . '</script>';

        if ($patchStyle) {
            $markup .= '<style type="text/css">' . $patchStyle . '</style>';
        }

        if ($patchScript) {
            $markup .= '<script type="text/javascript">' . $patchScript . '</script>';
        }

        return $markup;
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

    private function getTargetUser(Form $form): ?User
    {
        if ($form instanceof RolesForm) {
            return $form->getUser();
        }

        if ($form instanceof UserDetailsForm && isset($form->user)) {
            return $form->user;
        }

        return null;
    }

    private function normalizeInterests(mixed $interests): ?array
    {
        if ($interests === null || $interests === '') {
            return [];
        }

        if (is_string($interests)) {
            $interests = [$interests];
        }

        if (!is_array($interests)) {
            return null;
        }

        $normalized = [];
        foreach ($interests as $interest) {
            if (!is_string($interest)) {
                return null;
            }

            $interest = trim($interest);
            if ($interest !== '') {
                $normalized[] = $interest;
            }
        }

        return array_values(array_unique($normalized));
    }
}
