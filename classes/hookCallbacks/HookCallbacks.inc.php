<?php

class HookCallbacks
{
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

        $contextId = $context->getId();

        if ($template === 'user/profile.tpl') {
            $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: array();
            $optionsArray = array_values($options);

            $output = '$.pkp.plugins.generic = $.pkp.plugins.generic || {};';
            $output .= '$.pkp.plugins.generic.selectionOfReviewingInterests = ';
            $output .= '$.pkp.plugins.generic.selectionOfReviewingInterests || {};';
            $output .= '$.pkp.plugins.generic.selectionOfReviewingInterests.interestsOptions = ';
            $output .= json_encode($optionsArray) . ';';

            $templateMgr->addJavaScript(
                'interestsOptions',
                $output,
                [
                    'inline' => true,
                    'contexts' => 'backend',
                ]
            );

            $patchScriptUrl = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath() . '/js/interestsTagitPatch.js';

            $templateMgr->addJavaScript(
                'interestsTagitPatch',
                $patchScriptUrl,
                [
                    'contexts' => 'backend',
                    'priority' => STYLE_SEQUENCE_LATE,
                ]
            );

            if ($this->userShouldBeRedirected($request)) {
                $templateMgr->registerFilter(
                    'output',
                    [$this, 'requestMessageFilter']
                );
            }
        } elseif ($template === 'frontend/pages/userRegister.tpl') {
            $templateMgr->registerFilter(
                'output',
                [$this, 'registrationInterestsFilter']
            );
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
        if ($component == 'plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler') {
            return true;
        }
        return false;
    }
}
