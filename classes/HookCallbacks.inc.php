<?php

class HookCallbacks
{
    private const REVIEWER_INTEREST_FILTER_PARAM_PREFIX = 'interestOption__';

    private $plugin;

    public function __construct($plugin)
    {
        $this->plugin = $plugin;
    }

    public function addChangesOnTemplateDisplaying(string $hookName, array $params)
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
        } elseif (!empty($templateMgr->getState('menu')) && $this->userShouldBeRedirected($request)) {
            $request->redirect(null, 'user', 'profile');
        }

        return false;
    }

    public function redirectUserAfterLogin(string $hookName, array $params)
    {
        $url = &$params[0];
        if (strpos($url, '/submissions') === false) {
            return;
        }

        $request = Application::get()->getRequest();
        if ($this->userShouldBeRedirected($request)) {
            $url = $request->getDispatcher()->url($request, ROUTE_PAGE, null, 'user', 'profile');
        }
    }

    public function userShouldBeRedirected($request)
    {
        $context = $request->getContext();
        $user = $request->getUser();
        $userRoles = $user ? $user->getRoles($context->getId()) : [];
        $userRoles = array_map(function ($role) {
            return $role->getId();
        }, $userRoles);

        if (is_null($user) || !in_array(ROLE_ID_REVIEWER, $userRoles)) {
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
            $templateMgr->unregisterFilter('output', [$this, 'requestMessageFilter']);
        }
        return $output;
    }

    public function reviewerInterestFilterMarkupFilter($output, $templateMgr)
    {
        $pattern = '/<script type="text\/javascript">\s*pkp\.registry\.init\(\'select-reviewer-[^\']+\',\s*\'Container\',\s*\{.*?<\/script>/s';
        if (preg_match($pattern, $output, $matches, PREG_OFFSET_CAPTURE)) {
            $offset = $matches[0][1];

            $newOutput = substr($output, 0, $offset);
            $newOutput .= $this->getReviewerInterestFilterStyleTag();
            $newOutput .= $this->getReviewerInterestFilterComponentScriptTag();
            $newOutput .= substr($output, $offset);

            $output = $newOutput;
            $templateMgr->unregisterFilter('output', [$this, 'reviewerInterestFilterMarkupFilter']);
        }

        return $output;
    }

    public function registrationInterestsFilter($output, $templateMgr)
    {
        $pattern = '/<div\s+id="reviewerInterests"[^>]*>.*?<\/div>/s';

        if (preg_match($pattern, $output)) {
            $output = preg_replace($pattern, '', $output);
            $templateMgr->unregisterFilter('output', [$this, 'registrationInterestsFilter']);
        }

        return $output;
    }

    public function setupOptionsConfigurationGridHandler(string $hookName, array $params)
    {
        $component = &$params[0];
        if ($component == 'plugins.generic.selectionOfReviewingInterests.controllers.grid.InterestOptionsGridHandler') {
            return true;
        }
        return false;
    }

    public function addReviewerInterestFilterOnFormDisplay(string $hookName, array $params)
    {
        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $templateMgr = TemplateManager::getManager($request);
        $this->addReviewerInterestFilter($templateMgr, $context->getId());

        return false;
    }

    public function addInterestsScriptsOnUserDetailsFormDisplay(string $hookName, array $params)
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

    public function userDetailsInterestsAssetsFilter($output, $templateMgr)
    {
        if (strpos($output, 'id="userDetailsForm"') === false
                || !preg_match('/class="[^"]*\binterests\b[^"]*"/', $output)) {
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

    public function addReviewerInterestFilterParam(string $hookName, array $params)
    {
        $reviewerParams = &$params[0];
        $slimRequest = $params[1];

        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $availableOptions = $this->getInterestOptions($context->getId());
        $selectedOptions = [];
        foreach ($slimRequest->getQueryParams() as $param => $value) {
            if (strpos($param, self::REVIEWER_INTEREST_FILTER_PARAM_PREFIX) !== 0) {
                continue;
            }

            if (is_string($value)) {
                $selectedOptions[] = $value;
            }
        }

        $validatedOptions = $this->normalizeSelectedInterestOptions($selectedOptions, $availableOptions);
        if (empty($validatedOptions)) {
            return false;
        }

        $reviewerParams['interestOption'] = $validatedOptions;

        return false;
    }

    public function setReviewerInterestFilter(string $hookName, array $params)
    {
        $reviewerQueryBuilder = $params[0];
        $args = $params[1];

        if (empty($args['interestOption']) || (!is_string($args['interestOption']) && !is_array($args['interestOption']))) {
            return false;
        }

        $interestOptions = $this->normalizeSelectedInterestOptions($args['interestOption']);
        if (empty($interestOptions)) {
            return false;
        }

        $reviewerQueryBuilder->selectionOfReviewingInterestsInterestOptions = $interestOptions;

        return false;
    }

    public function applyReviewerInterestFilter(string $hookName, array $params)
    {
        $query = $params[0];
        $userQueryBuilder = $params[1];

        if (empty($userQueryBuilder->selectionOfReviewingInterestsInterestOptions)) {
            return false;
        }

        $interestOptions = $userQueryBuilder->selectionOfReviewingInterestsInterestOptions;
        $normalizedInterestOptions = array_map('mb_strtolower', $interestOptions);
        $placeholders = implode(', ', array_fill(0, count($normalizedInterestOptions), '?'));

        $query->whereExists(function ($query) use ($normalizedInterestOptions, $placeholders) {
            $query->from('user_interests', 'ui')
                ->join('controlled_vocab_entry_settings AS cves', 'ui.controlled_vocab_entry_id', '=', 'cves.controlled_vocab_entry_id')
                ->whereColumn('ui.user_id', '=', 'u.user_id')
                ->where('cves.setting_name', '=', 'interest')
                ->whereRaw('LOWER(cves.setting_value) IN (' . $placeholders . ')', $normalizedInterestOptions);
        });

        return false;
    }

    private function addInterestsScripts($templateMgr, $contextId)
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
                'priority' => STYLE_SEQUENCE_LATE,
            ]
        );

        $templateMgr->addStyleSheet(
            'interestsTagitPatch',
            $patchStyleUrl,
            [
                'contexts' => 'backend',
                'priority' => STYLE_SEQUENCE_LATE,
            ]
        );
    }

    private function getInterestsOptionsInlineScript($contextId)
    {
        $optionsArray = $this->getInterestOptions($contextId);
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

    private function getInterestsAssetsMarkup($contextId)
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

    private function addRedirectMessageFilter($templateMgr)
    {
        $templateMgr->registerFilter(
            'output',
            [$this, 'requestMessageFilter']
        );
    }

    private function addRegistrationFilter($templateMgr)
    {
        $templateMgr->registerFilter(
            'output',
            [$this, 'registrationInterestsFilter']
        );
    }

    private function addReviewerInterestFilter($templateMgr, $contextId)
    {
        $selectReviewerListData = $templateMgr->getTemplateVars('selectReviewerListData');
        if (empty($selectReviewerListData['components']['selectReviewer'])) {
            return;
        }

        $interestOptions = $this->getInterestOptions($contextId);
        if (empty($interestOptions)) {
            return;
        }

        $this->addReviewerInterestFilterMarkup($templateMgr);

        $filters = $selectReviewerListData['components']['selectReviewer']['filters'] ?? [];
        foreach ($interestOptions as $index => $interestOption) {
            $filters[] = [
                'param' => self::REVIEWER_INTEREST_FILTER_PARAM_PREFIX . $index,
                'value' => $interestOption,
                'title' => $interestOption,
                'groupTitle' => __('plugins.generic.selectionOfReviewingInterests.reviewer.filter.label'),
                'showGroupTitle' => $index === 0,
                'filterType' => 'reviewer-interest-filter',
            ];
        }

        $selectReviewerListData['components']['selectReviewer']['filters'] = $filters;
        $templateMgr->assign('selectReviewerListData', $selectReviewerListData);
    }

    private function addReviewerInterestFilterMarkup($templateMgr)
    {
        $templateMgr->registerFilter(
            'output',
            [$this, 'reviewerInterestFilterMarkupFilter']
        );
    }

    private function getReviewerInterestFilterComponentScriptTag()
    {
        $request = Application::get()->getRequest();
        $scriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/reviewerInterestFilter.js';

        return '<script type="text/javascript" src="' . $scriptUrl . '"></script>';
    }

    private function getReviewerInterestFilterStyleTag()
    {
        return '<style type="text/css">'
            . '.listPanel--selectReviewer .listPanel__sidebar{'
            . 'flex:0 0 192px !important;'
            . 'width:192px !important;'
            . 'min-width:192px !important;'
            . 'max-width:192px !important;'
            . 'box-sizing:border-box;'
            . '}'
            . '.listPanel--selectReviewer .listPanel__sidebar-enter{margin-inline-end:-192px !important;}'
            . '.listPanel--selectReviewer .listPanel__sidebar-leave-to{margin-inline-end:-192px !important;}'
            . '</style>';
    }

    private function getInterestOptions($contextId)
    {
        $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: array();
        $options = array_map('trim', array_values($options));

        return array_values(array_filter($options, function ($option) {
            return $option !== '';
        }));
    }

    private function normalizeSelectedInterestOptions($interestOptions, $availableOptions = null)
    {
        if (is_string($interestOptions)) {
            $interestOptions = [$interestOptions];
        } elseif (!is_array($interestOptions)) {
            return [];
        }

        $interestOptions = array_map('trim', $interestOptions);
        $interestOptions = array_values(array_unique(array_filter($interestOptions, function ($option) {
            return is_string($option) && $option !== '';
        })));

        if ($availableOptions === null) {
            return $interestOptions;
        }

        return array_values(array_filter($interestOptions, function ($option) use ($availableOptions) {
            return in_array($option, $availableOptions, true);
        }));
    }
}
