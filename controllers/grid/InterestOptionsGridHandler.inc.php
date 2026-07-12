<?php

import('lib.pkp.classes.controllers.grid.GridHandler');
import('lib.pkp.classes.core.JSONMessage');
import('plugins.generic.selectionOfReviewingInterests.controllers.grid.InterestOptionsGridCellProvider');
import('plugins.generic.selectionOfReviewingInterests.controllers.grid.form.InterestOptionForm');

class InterestOptionsGridHandler extends GridHandler
{
    private $plugin;
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

        $this->plugin = PluginRegistry::getPlugin('generic', 'selectionofreviewinginterestsplugin');

        $this->setTitle('plugins.generic.selectionOfReviewingInterests.configuration.grid.title');

        AppLocale::requireComponents(
            LOCALE_COMPONENT_PKP_USER,
            LOCALE_COMPONENT_PKP_MANAGER,
            LOCALE_COMPONENT_APP_MANAGER
        );

        $cellProvider = new InterestOptionsGridCellProvider();

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
        $this->setupTemplate($request);

        $interestOptionForm = new InterestOptionForm(
            $this->plugin,
            $this->contextId,
            null
        );
        $interestOptionForm->initData();

        return new JSONMessage(true, $interestOptionForm->fetch($request));
    }

    public function editOption($args, $request)
    {
        $optionId = isset($args['optionId']) ? $args['optionId'] : null;
        $this->setupTemplate($request);

        $interestOptionForm = new InterestOptionForm(
            $this->plugin,
            $this->contextId,
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

        $this->setupTemplate($request);

        $interestOptionForm = new InterestOptionForm(
            $this->plugin,
            $this->contextId,
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
        if (!$request->isPost() || !$request->checkCSRF()) {
            return new JSONMessage(false);
        }

        $optionId = $request->getUserVar('optionId');
        if (!is_string($optionId) || !preg_match('/\A[a-f0-9]{13}\z/D', $optionId)) {
            return new JSONMessage(false);
        }

        $options = $this->plugin->getSetting($this->contextId, 'interestOptions') ?: array();

        if (isset($options[$optionId])) {
            unset($options[$optionId]);
            $this->plugin->updateSetting($this->contextId, 'interestOptions', $options);
        }

        return DAO::getDataChangedEvent($optionId);
    }

    protected function loadData($request, $filter)
    {
        $options = $this->plugin->getSetting($this->contextId, 'interestOptions') ?: array();

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
        $options = $this->plugin->getSetting($this->contextId, 'interestOptions') ?: array();

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
        import('plugins.generic.selectionOfReviewingInterests.controllers.grid.InterestOptionsGridRow');
        return new InterestOptionsGridRow();
    }
}
