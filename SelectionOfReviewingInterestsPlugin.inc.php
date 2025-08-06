<?php

import('lib.pkp.classes.plugins.GenericPlugin');
import('plugins.generic.selectionOfReviewingInterests.classes.settings.SelectionOfReviewingInterestsManage');
import('plugins.generic.selectionOfReviewingInterests.classes.settings.SelectionOfReviewingInterestsActions');

class SelectionOfReviewingInterestsPlugin extends GenericPlugin
{
    public function register($category, $path, $mainContextId = null)
    {
        $success = parent::register($category, $path);
        if ($success && $this->getEnabled()) {
            HookRegistry::register('TemplateResource::getFilename', array($this, '_overridePluginTemplates'));
            HookRegistry::register('Request::redirect', [$this, 'redirectUserAfterLogin']);
        }
        return $success;
    }

    public function getDisplayName()
    {
        return __('plugins.generic.selectionOfReviewingInterests.displayName');
    }

    public function getDescription()
    {
        return __('plugins.generic.selectionOfReviewingInterests.description');
    }

    public function getActions($request, $actionArgs)
    {
        $actions = new SelectionOfReviewingInterestsActions($this);
        return $actions->execute($request, $actionArgs, parent::getActions($request, $actionArgs));
    }

    public function manage($args, $request)
    {
        $manage = new SelectionOfReviewingInterestsManage($this);
        return $manage->execute($args, $request);
    }

    public function getCanEnable()
    {
        $request = Application::get()->getRequest();
        return $request->getContext() !== null;
    }

    public function getCanDisable()
    {
        $request = Application::get()->getRequest();
        return $request->getContext() !== null;
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

}
