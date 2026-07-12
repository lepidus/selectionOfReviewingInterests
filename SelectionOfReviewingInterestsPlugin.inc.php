<?php

import('lib.pkp.classes.plugins.GenericPlugin');
import('plugins.generic.selectionOfReviewingInterests.classes.settings.SelectionOfReviewingInterestsManage');
import('plugins.generic.selectionOfReviewingInterests.classes.settings.SelectionOfReviewingInterestsActions');
import('plugins.generic.selectionOfReviewingInterests.classes.HookCallbacks');

class SelectionOfReviewingInterestsPlugin extends GenericPlugin
{
    public function register($category, $path, $mainContextId = null)
    {
        $success = parent::register($category, $path);
        if ($success && $this->getEnabled()) {
            $hookCallbacks = new HookCallbacks($this);
            HookRegistry::register('LoadComponentHandler', [$hookCallbacks, 'setupOptionsConfigurationGridHandler']);

            if ($this->hasConfiguredInterestOptions()) {
                HookRegistry::register('TemplateManager::display', [$hookCallbacks, 'addChangesOnTemplateDisplaying']);
                HookRegistry::register('userdetailsform::display', [$hookCallbacks, 'addInterestsScriptsOnUserDetailsFormDisplay']);
                HookRegistry::register('advancedsearchreviewerform::display', [$hookCallbacks, 'addReviewerInterestFilterOnFormDisplay']);
                HookRegistry::register('Request::redirect', [$hookCallbacks, 'redirectUserAfterLogin']);
                HookRegistry::register('API::users::reviewers::params', [$hookCallbacks, 'addReviewerInterestFilterParam']);
                HookRegistry::register('User::getReviewers::queryBuilder', [$hookCallbacks, 'setReviewerInterestFilter']);
                HookRegistry::register('User::getMany::queryObject', [$hookCallbacks, 'applyReviewerInterestFilter']);
                HookRegistry::register('registrationform::validate', [$hookCallbacks, 'validateSubmittedInterests']);
                HookRegistry::register('rolesform::validate', [$hookCallbacks, 'validateSubmittedInterests']);
                HookRegistry::register('userdetailsform::validate', [$hookCallbacks, 'validateSubmittedInterests']);
                HookRegistry::register('createreviewerform::validate', [$hookCallbacks, 'validateSubmittedInterests']);
            }
        }
        return $success;
    }

    public function getName()
    {
        return 'selectionofreviewinginterestsplugin';
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

    public function setEnabled($enabled)
    {
        parent::setEnabled($enabled);
        $templateMgr = TemplateManager::getManager(Application::get()->getRequest());
        $templateMgr->clearCompiledTemplate();
    }

    private function hasConfiguredInterestOptions()
    {
        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $options = $this->getSetting($context->getId(), 'interestOptions') ?: array();
        if (!is_array($options)) {
            return false;
        }

        $options = array_map('trim', array_values($options));
        return count(array_filter($options, function ($option) {
            return $option !== '';
        })) > 0;
    }
}
