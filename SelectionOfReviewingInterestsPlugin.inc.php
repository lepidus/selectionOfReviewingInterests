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
}
