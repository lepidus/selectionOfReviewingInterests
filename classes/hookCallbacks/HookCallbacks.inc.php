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
        if ($context) {
            $contextId = $context->getId();
            $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: array();

            $interestsOptions = [
                'interestsOptions' => array_values($options),
            ];

            $output = '$.pkp.plugins.generic = $.pkp.plugins.generic || {};';
            $output .= '$.pkp.plugins.generic.selectionOfReviewingInterests = $.pkp.plugins.generic.selectionOfReviewingInterests || {};';
            $output .= '$.pkp.plugins.generic.selectionOfReviewingInterests.interestsOptions = ' . json_encode(array_values($options)) . ';';

            $templateMgr->addJavaScript(
                'interestsOptions',
                $output,
                [
                    'inline' => true,
                    'contexts' => 'backend',
                ]
            );
        }

        if ($template === 'user/profile.tpl') {
            if ($this->userShouldBeRedirected($request)) {
                $templateMgr->registerFilter('output', [$this, 'requestMessageFilter']);
            }
            return;
        }

        $backendMenuState = $templateMgr->getState('menu');
        if (!empty($backendMenuState)) {
            if ($this->userShouldBeRedirected($request)) {
                $request->redirect(null, 'user', 'profile');
            }
        }
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

    public function setupOptionsConfigurationGridHandler(string $hookName, array $params)
    {
        $component = &$params[0];
        if ($component == 'plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler') {
            return true;
        }
        return false;
    }
}
