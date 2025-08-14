<?php

import('lib.pkp.classes.controllers.grid.GridHandler');
import('lib.pkp.classes.core.JSONMessage');
import('plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridCellProvider');
import('plugins.generic.selectionOfReviewingInterests.controllers.grid.form.InterestOptionForm');

class SelectionOfReviewingInterestsGridHandler extends GridHandler
{
    private $contextId;

    public function __construct()
    {
        parent::__construct();

        $this->addRoleAssignment(
            array(ROLE_ID_MANAGER),
            array(
                'fetchGrid',
                'fetchCategory',
                'fetchRow',
                'addOption',
                'editOption',
                'updateOption',
                'deleteOption'
            )
        );
    }

    public function authorize($request, &$args, $roleAssignments)
    {
        import('lib.pkp.classes.security.authorization.ContextAccessPolicy');
        $this->addPolicy(new ContextAccessPolicy($request, $roleAssignments));

        return parent::authorize($request, $args, $roleAssignments);
    }

    public function initialize($request, $args = null)
    {
        parent::initialize($request, $args);

        $context = $request->getContext();
        $this->contextId = $context->getId();

        AppLocale::requireComponents(
            LOCALE_COMPONENT_PKP_USER,
            LOCALE_COMPONENT_PKP_MANAGER,
            LOCALE_COMPONENT_APP_MANAGER
        );

        $cellProvider = new SelectionOfReviewingInterestsGridCellProvider();

        $this->addColumn(
            new GridColumn(
                'option',
                'plugins.generic.selectionOfReviewingInterests.configuration.grid.column.option',
                null,
                null,
                $cellProvider
            )
        );

        $router = $request->getRouter();
        import('lib.pkp.classes.linkAction.request.AjaxModal');
        import('lib.pkp.classes.linkAction.LinkAction');

        $this->addAction(
            new LinkAction(
                'addOption',
                new AjaxModal(
                    $router->url(
                        $request,
                        null,
                        null,
                        'addOption'
                    ),
                    __('plugins.generic.selectionOfReviewingInterests.configuration.addOption'),
                    'modal_add_item',
                    true
                ),
                __('plugins.generic.selectionOfReviewingInterests.configuration.addOption'),
                'add_item'
            )
        );
    }

    public function addOption($args, $request)
    {
        $context = $request->getContext();
        $this->setupTemplate($request);

        $plugin = PluginRegistry::getPlugin('generic', 'selectionofreviewinginterests');
        if (!$plugin) {
            return new JSONMessage(false, __('common.error'));
        }

        $interestOptionForm = new InterestOptionForm(
            $plugin,
            $context->getId(),
            null
        );
        $interestOptionForm->initData();

        return new JSONMessage(true, $interestOptionForm->fetch($request));
    }

    public function editOption($args, $request)
    {
        $optionId = isset($args['optionId']) ? $args['optionId'] : null;
        $context = $request->getContext();
        $this->setupTemplate($request);

        $plugin = PluginRegistry::getPlugin('generic', 'selectionofreviewinginterests');
        if (!$plugin) {
            return new JSONMessage(false, __('common.error'));
        }

        $interestOptionForm = new InterestOptionForm(
            $plugin,
            $context->getId(),
            $optionId
        );
        $interestOptionForm->initData();

        return new JSONMessage(true, $interestOptionForm->fetch($request));
    }

    public function updateOption($args, $request)
    {
        $optionId = isset($args['optionId']) ? $args['optionId'] : null;

        if ($optionId === '' || $optionId === '0') {
            $optionId = null;
        }

        $context = $request->getContext();
        $this->setupTemplate($request);

        $plugin = PluginRegistry::getPlugin(
            'generic',
            'selectionofreviewinginterests'
        );
        if (!$plugin) {
            return new JSONMessage(false, __('common.error'));
        }

        $interestOptionForm = new InterestOptionForm(
            $plugin,
            $context->getId(),
            $optionId
        );
        $interestOptionForm->readInputData();

        if ($interestOptionForm->validate()) {
            $resultId = $interestOptionForm->execute();

            if ($optionId === null) {
                $optionId = $resultId;
            }

            return DAO::getDataChangedEvent($optionId);
        } else {
            return new JSONMessage(true, $interestOptionForm->fetch($request));
        }
    }

    public function deleteOption($args, $request)
    {
        $optionId = $request->getUserVar('optionId');
        $context = $request->getContext();
        $contextId = $context->getId();

        $plugin = PluginRegistry::getPlugin(
            'generic',
            'selectionofreviewinginterests'
        );
        if (!$plugin) {
            return new JSONMessage(false, __('common.error'));
        }

        $options = $plugin->getSetting($contextId, 'interestOptions') ?: array();

        if (isset($options[$optionId])) {
            unset($options[$optionId]);
            $plugin->updateSetting($contextId, 'interestOptions', $options);
        }

        return DAO::getDataChangedEvent($optionId);
    }

    protected function loadData($request, $filter)
    {
        $plugin = PluginRegistry::getPlugin(
            'generic',
            'selectionofreviewinginterests'
        );
        if (!$plugin) {
            return array();
        }

        $contextId = $this->contextId;
        $options = $plugin->getSetting($contextId, 'interestOptions') ?: array();

        $gridData = array();
        foreach ($options as $optionId => $optionText) {
            $gridData[$optionId] = array(
                'id' => $optionId,
                'option' => $optionText
            );
        }

        return $gridData;
    }

    protected function getRowDataElement($request, &$rowId)
    {
        $plugin = PluginRegistry::getPlugin(
            'generic',
            'selectionofreviewinginterests'
        );
        if (!$plugin) {
            return null;
        }

        $contextId = $this->contextId;
        $options = $plugin->getSetting($contextId, 'interestOptions') ?: array();

        if (isset($options[$rowId])) {
            return array(
                'id' => $rowId,
                'option' => $options[$rowId]
            );
        }

        return null;
    }

    protected function getRowInstance()
    {
        import(
            'plugins.generic.selectionOfReviewingInterests.controllers.grid.' .
            'SelectionOfReviewingInterestsGridRow'
        );
        return new SelectionOfReviewingInterestsGridRow();
    }

    private function _getContextId()
    {
        return $this->contextId;
    }
}
