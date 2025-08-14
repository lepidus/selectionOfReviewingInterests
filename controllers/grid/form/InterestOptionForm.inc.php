<?php

import('lib.pkp.classes.form.Form');

class InterestOptionForm extends Form
{
    private $_plugin;
    private $_contextId;
    private $_optionId;

    public function __construct($plugin, $contextId, $optionId = null)
    {
        $this->_plugin = $plugin;
        $this->_contextId = $contextId;
        $this->_optionId = $optionId;

        if (!$plugin) {
            fatalError('Plugin is required');
        }

        parent::__construct($plugin->getTemplateResource('form/interestOptionForm.tpl'));

        $this->addCheck(new FormValidator(
            $this,
            'optionName',
            'required',
            'plugins.generic.selectionOfReviewingInterests.form.optionName.required'
        ));

        $this->addCheck(new FormValidatorPost($this));
        $this->addCheck(new FormValidatorCSRF($this));
    }

    public function initData()
    {
        if ($this->_optionId !== null && $this->_optionId !== '' && $this->_optionId !== '0') {
            $options = $this->_plugin->getSetting($this->_contextId, 'interestOptions') ?: array();
            if (isset($options[$this->_optionId])) {
                $this->setData('optionName', $options[$this->_optionId]);
            }
        }
    }

    public function readInputData()
    {
        $this->readUserVars(array('optionName'));
    }

    public function execute(...$functionArgs)
    {
        $options = $this->_plugin->getSetting($this->_contextId, 'interestOptions') ?: array();
        $optionName = $this->getData('optionName');

        if ($this->_optionId === null || $this->_optionId === '' || $this->_optionId === '0') {
            do {
                $optionId = uniqid();
            } while (isset($options[$optionId]));
        } else {
            $optionId = $this->_optionId;
        }

        $options[$optionId] = $optionName;
        $this->_plugin->updateSetting(
            $this->_contextId,
            'interestOptions',
            $options
        );

        return $optionId;
    }

    public function fetch($request, $template = null, $display = false)
    {
        $templateMgr = TemplateManager::getManager($request);
        $templateMgr->assign('optionId', $this->_optionId);
        $templateMgr->assign('optionName', $this->getData('optionName'));
        return parent::fetch($request, $template, $display);
    }
}
