<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes\settings;

use PKP\linkAction\LinkAction;
use PKP\linkAction\request\AjaxModal;

class SelectionOfReviewingInterestsActions
{
    public $plugin;

    public function __construct($plugin)
    {
        $this->plugin = $plugin;
    }

    public function execute($request, $actionArgs, $parentActions)
    {
        $router = $request->getRouter();

        return array_merge(
            $this->plugin->getEnabled() ? [
                new LinkAction(
                    'settings',
                    new AjaxModal(
                        $router->url(
                            $request,
                            null,
                            null,
                            'manage',
                            null,
                            ['verb' => 'settings', 'plugin' => $this->plugin->getName(), 'category' => 'generic']
                        ),
                        $this->plugin->getDisplayName()
                    ),
                    __('manager.plugins.settings'),
                    null
                ),
            ] : [],
            $parentActions
        );
    }
}
