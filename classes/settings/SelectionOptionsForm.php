<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes\settings;

use PKP\form\Form;
use PKP\form\validation\FormValidatorCSRF;
use PKP\form\validation\FormValidatorPost;

class SelectionOptionsForm extends Form
{
    private $plugin;
    private $contextId;

    public function __construct($plugin, $contextId)
    {
        $this->plugin = $plugin;
        $this->contextId = $contextId;

        $template = 'settings/form.tpl';
        parent::__construct($plugin->getTemplateResource($template));

        $this->addCheck(new FormValidatorPost($this));
        $this->addCheck(new FormValidatorCSRF($this));
    }

    public function fetch($request, $template = null, $display = false)
    {
        return parent::fetch($request);
    }

    public function readInputData()
    {
        parent::readInputData();
    }

    public function execute(...$functionArgs)
    {
        parent::execute(...$functionArgs);
    }
}
