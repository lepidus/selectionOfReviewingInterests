<?php

import('lib.pkp.classes.controllers.grid.GridHandler');
import('lib.pkp.classes.core.JSONMessage');
import('plugins.generic.rankingPlugin.controllers.grid.RankingConfigurationGridCellProvider');
import('plugins.generic.rankingPlugin.controllers.grid.form.RankingCustomizationForm');

class SelectionOfReviewingInterestsGridHandler extends GridHandler
{
    private $contextId;

    private $currentGridData;

    public function __construct()
    {
        parent::__construct();

        $this->addRoleAssignment(
            array(ROLE_ID_MANAGER),
            array(
                'fetchGrid',
                'fetchCategory',
                'fetchRow'
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

        $columnsInfo = [
            1 => [
                'id' => 'enabled',
                'title' => 'plugins.generic.rankingPlugin.configuration.grid.'.
                    'column.enabled',
                'template' => 'controllers/grid/common/cell/selectStatusCell.tpl'
            ],
            2 => [
                'id' => 'defaultTitle',
                'title' => 'plugins.generic.rankingPlugin.configuration.grid.'.
                    'column.defaultTitle',
                'template' => null
            ],
            3 => [
                'id' => 'customTitle',
                'title' => 'plugins.generic.rankingPlugin.configuration.grid.'.
                    'column.customTitle',
                'template' => null
            ],
            4 => [
                'id' => 'customDescription',
                'title' => 'plugins.generic.rankingPlugin.configuration.grid.'.
                    'column.customDescription',
                'template' => null
            ],
        ];

        foreach ($columnsInfo as $columnInfo) {
            $this->addColumn(
                new GridColumn(
                    $columnInfo['id'],
                    $columnInfo['title'],
                    null,
                    $columnInfo['template'],
                    $cellProvider
                )
            );
        }
    }

    protected function loadData($request, $filter)
    {
    }

    protected function getRowInstance()
    {
    }

    private function getContextId()
    {
        return $this->contextId;
    }
}
