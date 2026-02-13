<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes\hookCallbacks;

use APP\core\Application;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use PKP\security\Role;

class HookCallbacks
{
    private SelectionOfReviewingInterestsPlugin $plugin;
    private ?\Closure $messageFilterCallback = null;

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

        if ($context) {
            $contextId = $context->getId();
            $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: [];
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
        }

        if ($template === 'user/profile.tpl' && $this->userShouldBeRedirected($request)) {
            $this->messageFilterCallback = $this->requestMessageFilter(...);
            $templateMgr->registerFilter('output', $this->messageFilterCallback);
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
}
