<?php

namespace APP\plugins\generic\selectionOfReviewingInterests;

use APP\core\Application;
use APP\plugins\generic\selectionOfReviewingInterests\classes\HookCallbacks;
use APP\plugins\generic\selectionOfReviewingInterests\classes\settings\Actions;
use APP\plugins\generic\selectionOfReviewingInterests\classes\settings\Manage;
use APP\plugins\generic\selectionOfReviewingInterests\controllers\grid\InterestOptionsGridHandler;
use APP\template\TemplateManager;
use PKP\plugins\GenericPlugin;
use PKP\plugins\Hook;

class SelectionOfReviewingInterestsPlugin extends GenericPlugin
{
    public function register($category, $path, $mainContextId = null)
    {
        $success = parent::register($category, $path, $mainContextId);

        if (Application::isUnderMaintenance()) {
            return $success;
        }

        if ($success && $this->getEnabled($mainContextId)) {
            $hookCallbacks = new HookCallbacks($this);
            Hook::add('LoadComponentHandler', $this->setupGridHandler(...));

            if ($this->hasConfiguredInterestOptions()) {
                Hook::add('TemplateManager::display', $hookCallbacks->addChangesOnTemplateDisplaying(...));
                Hook::add('userdetailsform::display', $hookCallbacks->addInterestsScriptsOnUserDetailsFormDisplay(...));
                Hook::add('Request::redirect', $hookCallbacks->redirectUserAfterLogin(...));
                Hook::add('TemplateManager::fetch', $hookCallbacks->addInterestFilterToReviewerPanel(...));
                Hook::add('API::users::reviewers::params', $hookCallbacks->addInterestFilterParam(...));
                Hook::add('User::Collector', $hookCallbacks->filterReviewersByInterest(...));
            }
        }

        return $success;
    }

    private function hasConfiguredInterestOptions(): bool
    {
        $request = Application::get()->getRequest();
        $context = $request->getContext();
        if (!$context) {
            return false;
        }

        $options = $this->getSetting($context->getId(), 'interestOptions') ?: [];
        if (!is_array($options)) {
            return false;
        }

        $options = array_map('trim', array_values($options));
        return count(array_filter($options, function ($option) {
            return $option !== '';
        })) > 0;
    }

    public function setupGridHandler(string $hookName, array $params): bool
    {
        $component = &$params[0];
        $componentInstance = &$params[2];

        if ($component === 'plugins.generic.selectionOfReviewingInterests.controllers.grid.InterestOptionsGridHandler') {
            $componentInstance = new InterestOptionsGridHandler($this);
            return true;
        }

        return false;
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
        $actions = new Actions($this);
        return $actions->execute($request, $actionArgs, parent::getActions($request, $actionArgs));
    }

    public function manage($args, $request)
    {
        $manage = new Manage($this);
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
}
