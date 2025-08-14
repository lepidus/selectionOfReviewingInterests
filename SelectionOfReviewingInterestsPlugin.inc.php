<?php

import('lib.pkp.classes.plugins.GenericPlugin');
import('plugins.generic.selectionOfReviewingInterests.classes.settings.SelectionOfReviewingInterestsManage');
import('plugins.generic.selectionOfReviewingInterests.classes.settings.SelectionOfReviewingInterestsActions');
import('plugins.generic.selectionOfReviewingInterests.classes.hookCallbacks.HookCallbacks');

class SelectionOfReviewingInterestsPlugin extends GenericPlugin
{
    public function register($category, $path, $mainContextId = null)
    {
        $success = parent::register($category, $path);
        if ($success && $this->getEnabled()) {
            $hookCallbacks = new HookCallbacks($this);
            HookRegistry::register('TemplateManager::display', [$hookCallbacks, 'addChangesOnTemplateDisplaying']);
            HookRegistry::register('TemplateResource::getFilename', array($this, '_overridePluginTemplates'));
            HookRegistry::register('Request::redirect', [$hookCallbacks, 'redirectUserAfterLogin']);
            HookRegistry::register('LoadComponentHandler', [$hookCallbacks, 'setupOptionsConfigurationGridHandler']);

            $this->setupDefaultOptions();
        }
        return $success;
    }

    public function getName()
    {
        return 'selectionofreviewinginterests';
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

    private function setupDefaultOptions()
    {
        $request = Application::get()->getRequest();
        $context = $request->getContext();

        if ($context) {
            $contextId = $context->getId();
            $existingOptions = $this->getSetting($contextId, 'interestOptions');

            if (empty($existingOptions)) {
                $defaultOptions = [
                    'opt1' => 'Estudos teóricos e de campo em escalas que variam do local ao regional/global',
                    'opt2' => 'Inovações em técnicas e instrumentação para campo e laboratório',
                    'opt3' => 'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade',
                    'opt4' => 'Aplicações da hidrogeologia nas engenharias, geofísica, geotecnia e mineração',
                    'opt5' => 'Estado da arte e filosofia dos métodos científicos em hidrogeologia',
                    'opt6' => 'Interações entre populações e sistemas hidrogeológicos',
                    'opt7' => 'Economia dos sistemas hidrogeológicos',
                    'opt8' => 'Contribuições da hidrogeologia para a proteção ambiental',
                    'opt9' => 'Sustentabilidade e resiliência hídrica',
                    'opt10' => 'Águas subterrâneas na política e na governança dos recursos hídricos'
                ];

                $this->updateSetting($contextId, 'interestOptions', $defaultOptions);
            }
        }
    }
}
