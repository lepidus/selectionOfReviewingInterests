<?php

import('lib.pkp.classes.form.Form');

class SelectionOptionsForm extends Form
{
    private $plugin;
    private $contextId;

    public function __construct($plugin, $contextId)
    {
        $this->plugin = $plugin;
        $this->contextId = $contextId;
        $this->addFormValidators();

        $template = 'settings/form.tpl';
        parent::__construct($plugin->getTemplateResource($template));
    }

    private function addFormValidators(): void
    {
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
