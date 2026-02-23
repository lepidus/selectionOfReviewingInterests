<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\controllers\grid;

use APP\plugins\generic\selectionOfReviewingInterests\controllers\grid\form\InterestOptionForm;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use PKP\controllers\grid\GridColumn;
use PKP\controllers\grid\GridHandler;
use PKP\core\JSONMessage;
use PKP\db\DAO;
use PKP\linkAction\LinkAction;
use PKP\linkAction\request\AjaxModal;
use PKP\security\authorization\ContextAccessPolicy;
use PKP\security\Role;

class SelectionOfReviewingInterestsGridHandler extends GridHandler
{
    public SelectionOfReviewingInterestsPlugin $plugin;
    private $contextId;

    public function __construct(SelectionOfReviewingInterestsPlugin $plugin)
    {
        parent::__construct();
        $this->plugin = $plugin;

        $this->addRoleAssignment(
            [Role::ROLE_ID_MANAGER],
            [
                'fetchGrid',
                'fetchCategory',
                'fetchRow',
                'addOption',
                'editOption',
                'updateOption',
                'deleteOption'
            ]
        );
    }

    public function authorize($request, &$args, $roleAssignments)
    {
        $this->addPolicy(new ContextAccessPolicy($request, $roleAssignments));
        return parent::authorize($request, $args, $roleAssignments);
    }

    public function initialize($request, $args = null)
    {
        parent::initialize($request, $args);

        $context = $request->getContext();
        $this->contextId = $context->getId();

        $this->setTitle('plugins.generic.selectionOfReviewingInterests.configuration.grid.title');

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

        $interestOptionForm = new InterestOptionForm(
            $this->plugin,
            $context->getId(),
            null
        );
        $interestOptionForm->initData();

        return new JSONMessage(true, $interestOptionForm->fetch($request));
    }

    public function editOption($args, $request)
    {
        $optionId = $args['optionId'] ?? null;
        $context = $request->getContext();
        $this->setupTemplate($request);

        $interestOptionForm = new InterestOptionForm(
            $this->plugin,
            $context->getId(),
            $optionId
        );
        $interestOptionForm->initData();

        return new JSONMessage(true, $interestOptionForm->fetch($request));
    }

    public function updateOption($args, $request)
    {
        $optionId = $args['optionId'] ?? null;

        if ($optionId === '' || $optionId === '0') {
            $optionId = null;
        }

        $context = $request->getContext();
        $this->setupTemplate($request);

        $interestOptionForm = new InterestOptionForm(
            $this->plugin,
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

        $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: [];

        if (isset($options[$optionId])) {
            unset($options[$optionId]);
            $this->plugin->updateSetting($contextId, 'interestOptions', $options);
        }

        return DAO::getDataChangedEvent($optionId);
    }

    protected function loadData($request, $filter)
    {
        $contextId = $this->contextId;
        $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: [];

        $gridData = [];
        foreach ($options as $optionId => $optionText) {
            $gridData[$optionId] = [
                'id' => $optionId,
                'option' => $optionText
            ];
        }

        return $gridData;
    }

    protected function getRowDataElement($request, &$rowId)
    {
        $contextId = $this->contextId;
        $options = $this->plugin->getSetting($contextId, 'interestOptions') ?: [];

        if (isset($options[$rowId])) {
            return [
                'id' => $rowId,
                'option' => $options[$rowId]
            ];
        }

        return null;
    }

    protected function getRowInstance()
    {
        return new SelectionOfReviewingInterestsGridRow();
    }
}
